var data = [
{
  region: "BE",
  population: 11,
  // population: 11576699,
  days: ["Feb 15","Feb 16","Feb 17","Feb 18","Feb 19","Feb 20","Feb 21","Feb 22","Feb 23","Feb 24","Feb 25","Feb 26","Feb 27","Feb 28","Feb 29","Mar 01","Mar 02","Mar 03","Mar 04","Mar 05","Mar 06","Mar 07","Mar 08","Mar 09","Mar 10","Mar 11","Mar 12","Mar 13","Mar 14","Mar 15","Mar 16","Mar 17","Mar 18","Mar 19","Mar 20","Mar 21","Mar 22","Mar 23","Mar 24","Mar 25","Mar 26","Mar 27"],
  deaths: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,1,0,6,0,4,7,16,30,8,13,34,56,42,69],
  source: "https://www.worldometers.info/coronavirus/country/belgium"
},
{
  region: "USA",
  population: 330,
  // population: 330499410,
  days: ["Feb 15","Feb 16","Feb 17","Feb 18","Feb 19","Feb 20","Feb 21","Feb 22","Feb 23","Feb 24","Feb 25","Feb 26","Feb 27","Feb 28","Feb 29","Mar 01","Mar 02","Mar 03","Mar 04","Mar 05","Mar 06","Mar 07","Mar 08","Mar 09","Mar 10","Mar 11","Mar 12","Mar 13","Mar 14","Mar 15","Mar 16","Mar 17","Mar 18","Mar 19","Mar 20","Mar 21","Mar 22","Mar 23","Mar 24","Mar 25","Mar 26", "Mar 27"],
  deaths: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,5,3,2,1,3,4,3,4,4,8,3,7,9,12,18,23,40,56,49,46,113,141,225,247,268, 401],
  source: "https://www.worldometers.info/coronavirus/country/us/"
},
{
  region: "NY",
  population: 19,
  // population: 19453561,
  days: ["Mar 27", "Mar 28"],
  source: "https://www.worldometers.info/coronavirus/country/us/"
}
]

let lastItem = (arr) => arr[arr.length-1]

let be = lastItem(data[0].deaths) / data[0].population;
let us = lastItem(data[1].deaths) / data[1].population;
let ny = lastItem(data[2].deaths) / data[2].population;

console.log("be=", be, "ny=", ny, "us=", us)
console.log((ny - be) / be * 100)


// for (let i = 0; i < data[0].deaths.length; i++) {
//   let a = data[0].deaths[i] / data[0].population;
//   let b = data[1].deaths[i] / data[1].population;
//   console.log(a, b)
// }
