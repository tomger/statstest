from datetime import date, timedelta
import pathlib
import os
import argparse

import requests

RAW_DATA_DIR = "raw_data"
BASE_DATA_URL = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports"
DAYS = 31


def get_date_files():
    date_files = []
    cur = date.today()
    for _ in range(DAYS):
        cur -= timedelta(1)
        date_files.append(cur.strftime("%m-%d-%Y.csv"))
    return date_files


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

    # ensure the dates exist in raw data
    filepaths = [os.path.join(RAW_DATA_DIR, fn) for fn in date_files]
    if not all(os.path.isfile(fp) for fp in filepaths):
        raise RuntimeError("Need to download some files, rerun with --raw")



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
