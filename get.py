import urllib.request
import io
import pandas as pd

region_index = []

population_states = pd.read_csv('nst-est2019-alldata.csv')


request = urllib.request.urlopen('https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv')
csv_data = request.read()
data = pd.read_csv(io.StringIO(csv_data.decode('utf-8')))
# print (data[0:5]['cases'])
# df = pd.DataFrame(data, columns= ['cases'])
# df.to_csv ('testing.csv', index = False, header=True)

df = pd.DataFrame(data)
# print df
# print df.head()  

for state in df['state'].unique():
    # select fields
    state_df = df.loc[df['state'] == state].filter(['date', 'cases', 'deaths'])
    # print(state, state_df)
    # format date

    # rename fields
    # state_df = state_df.rename(columns={"date": "Date"})

    # output
    path = f"data/{state}.csv".replace(" ", "_")
    state_df.to_csv(path, index = False, header=True)

    # find population
    population_row = population_states.query(f"NAME == '{state}'")
    population = population_row['POPESTIMATE2019'].to_string(index=False)

    # add to index
    region_index.append({
        'path': path,
        'name': state,
        'population': population
    })

region_index_df = pd.DataFrame(region_index)
region_index_df.to_csv("data/regions.csv", index = False, header=True)
