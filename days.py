import datetime
import pathlib
import os
import argparse
import math
import re

import requests
import pandas as pd


URL_PREFIX = "https://covid.iterator.us"
RAW_DATA_DIR = "raw_data"
CSV_PATH = "data/{}.csv"
BASE_DATA_URL = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports"
DAYS = 30
DAYS_BUFFER = DAYS + 7 + 1


def get_change(df):
    start = df.head(1)['rolling_cases'].mean()
    end = df.tail(1)['rolling_cases'].mean()
    if start == 0:
        return 0
    change = (end - start) / start
    if math.isnan(change):
        return 0
    return round(change * 100)


def get_dates():
    dates = []
    cur = datetime.date.today()
    for _ in range(DAYS_BUFFER):
        cur -= datetime.timedelta(1)
        dates.append(cur)
    return dates


def get_date_files():
    return [d.strftime("%m-%d-%Y.csv") for d in get_dates()]


def get_raw_data(*, refetch):
    date_files = get_date_files()

    pathlib.Path(RAW_DATA_DIR).mkdir(parents=True, exist_ok=True)
    for filename in date_files:
        filepath = os.path.join(RAW_DATA_DIR, filename)
        if not refetch and os.path.isfile(filepath):
            continue
        print("Downloading", filename)
        r = requests.get("%s/%s" % (BASE_DATA_URL, filename))
        with open(filepath, "wb") as f:
            f.write(r.content)


def process_data():
    date_files = get_date_files()
    dates = get_dates()

    # ensure the dates exist in raw data
    filepaths = [os.path.join(RAW_DATA_DIR, fn) for fn in date_files]
    if not all(os.path.isfile(fp) for fp in filepaths):
        raise RuntimeError("Need to download some files, rerun with --raw")

    arr = []
    for d, fp in zip(dates, filepaths):
        data = pd.read_csv(fp)
        data['date'] = d
        arr.append(data)

    data = pd.concat(arr, ignore_index=True)
    places = data['Combined_Key'].unique()
    region_index = []
    for p in places:
        df = data.loc[data['Combined_Key'] == p].sort_values('date')

        df['cases'] = df['Confirmed'].diff().fillna(0).clip(lower=0).astype(int)
        df['rolling_cases'] = df['cases'].rolling(7).mean().fillna(0).astype(int)

        df = df[df.date >= datetime.date.today() - datetime.timedelta(days=DAYS)]

        last = df.iloc[-1]
        name = last.Combined_Key
        path = re.sub(r'\s?,\s?', '_', name).replace(' ', '-').lower()

        if math.isnan(last.Incident_Rate):
            continue
        population = round(100e3 * last.Confirmed / last.Incident_Rate) if last.Incident_Rate else 0

        pdata = {
            'path': path,
            'name': name,
            'byline': '',  # TODO
            'population': population,
            'change-cases': get_change(df),
            'last-updated': last.Last_Update.split()[0],
            'last-cases': last.rolling_cases,
            'total-cases': last.cases,
        }
        region_index.append(pdata)
        print(path)
        df.to_csv(CSV_PATH.format(path),
                  columns=['date', 'cases', 'rolling_cases'],
                  index=False,
                  header=True)

    pd.DataFrame(region_index).to_csv("data/regions.csv", index=False, header=True)
    write_indexes(region_index)
    write_sitemap(region_index)
    with open('lastupdate', 'w') as f:
        f.write('date\n' + str(datetime.datetime.today()))


def write_sitemap(array):
    sitemap_head = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">'
    sitemap_item = '<url><loc>%s/region/{}</loc></url>' % URL_PREFIX
    sitemap_foot = '</urlset>'

    output = [sitemap_head]
    for region in array:
        output.append(sitemap_item.format(region['path']))
    output.append(sitemap_foot)

    with open("sitemap.xml", "w") as f:
        f.write(''.join(output))


def write_indexes(array):
    with open("index.html") as f:
        template = f.read()

    for region in array:
        with open('region/{}'.format(region['path']), "w") as f:
            f.write(template.replace('<title>COVID-19 Watchlist</title>', '<title>COVID-19 Watchlist {}</title>'.format(region['name'])))


def main():
    parser = argparse.ArgumentParser(description="TODO")
    parser.add_argument("--raw", default=True,
                        action=argparse.BooleanOptionalAction,
                        help="Fetch raw data")
    parser.add_argument("--refetch", default=False,
                        action=argparse.BooleanOptionalAction,
                        help="Fetch raw data even if data already exists locally")
    parser.add_argument("--process", default=True,
                        action=argparse.BooleanOptionalAction,
                        help="Process and write data")
    args = parser.parse_args()

    if args.raw:
        get_raw_data(refetch=args.refetch)
    if args.process:
        process_data()

if __name__ == '__main__':
    main()
