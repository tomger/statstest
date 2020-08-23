import urllib2
import io
import pandas as pd

region_index = []

def get_counties():
    population_counties = pd.read_csv('co-est2019.csv')
    # covid_counties = pd.read_csv('us-counties.csv')

    request = urllib2.urlopen('https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv')
    csv_data = request.read()
    covid_counties = pd.read_csv(io.StringIO(csv_data.decode('utf-8')))

    for index, row in population_counties.iterrows():
        state = row['STNAME']
        county = row['CTYNAME'].replace(" County", "")
        population = row['POPESTIMATE2019']

        df = covid_counties.loc[
            (covid_counties['state'] == state) &
            (covid_counties['county'] == county)].filter(['date', 'cases', 'deaths'])
        
        # cummulative to delta
        df['cases'] = df['cases'].diff().fillna(0).astype(int)
        df['deaths'] = df['deaths'].diff().fillna(0).astype(int)
    
        # format date

        # rename fields
        # state_df = state_df.rename(columns={"date": "Date"})

        # output
        path = "data/us-co-{}-{}.csv".format(county, state).replace(" ", "-").lower()
        df.to_csv(path, index = False, header=True)


        # add to index
        region_index.append({
            'path': path,
            'name': "{}, {}".format(county, state),
            'population': population,
            'last-updated': df.tail(1)['date'].to_string(index=False),
            'last-cases': df.tail(7)['cases'].mean(),
        })


# States

def get_states():
    population_states = pd.read_csv('nst-est2019-alldata.csv')
    request = urllib2.urlopen('https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv')
    csv_data = request.read()
    data = pd.read_csv(io.StringIO(csv_data.decode('utf-8')))
    df = pd.DataFrame(data)

    for state in df['state'].unique():
        # select fields
        state_df = df.loc[df['state'] == state].filter(['date', 'cases', 'deaths'])

        # cummulative to delta
        state_df['cases'] = state_df['cases'].diff().fillna(0).astype(int)
        state_df['deaths'] = state_df['deaths'].diff().fillna(0).astype(int)
        
        # format date

        # rename fields
        # state_df = state_df.rename(columns={"date": "Date"})

        # output
        path = "data/us-st-{}.csv".format(state).replace(" ", "-").lower()
        state_df.to_csv(path, index = False, header=True)

        # find population
        population_row = population_states.query("NAME == '{}'".format(state))
        population = population_row['POPESTIMATE2019'].to_string(index=False)

        # add to index
        region_index.append({
            'path': path,
            'name': state,
            'population': population,
            'last-updated': state_df.tail(1)['date'].to_string(index=False),
            'last-cases': state_df.tail(7)['cases'].mean(),
        })


get_states()
get_counties()

region_index_df = pd.DataFrame(region_index)
region_index_df.to_csv("data/regions.csv", index = False, header=True)
