export const PARTICIPANTS = [
  { name: "Lucio", teams: ["Mexico", "South Africa"] },
  { name: "John", teams: ["South Korea", "DR Congo"] },
  { name: "Catherine", teams: ["Czechia", "France"] },
  { name: "Nabeel", teams: ["Canada", "England"] },
  { name: "Mariola", teams: ["Bosnia", "Belgium"] },
  { name: "Christopher", teams: ["Switzerland", "Cape Verde"] },
  { name: "Leigh", teams: ["Qatar", "Ivory Coast"] },
  { name: "Nikesh", teams: ["Brazil", "Uzbekistan"] },
  { name: "Cassie", teams: ["Morocco", "Saudi Arabia"] },
  { name: "Lucia", teams: ["Scotland", "Iran"] },
  { name: "Ahmed", teams: ["Haiti", "Curacao"] },
  { name: "Matteo", teams: ["USA", "Tunisia"] },
  { name: "Neil", teams: ["Turkiye", "Jordan"] },
  { name: "Dimitar", teams: ["Australia", "Argentina"] },
  { name: "Georgie", teams: ["Paraguay", "Croatia"] },
  { name: "Kfir", teams: ["Germany", "Panama"] },
  { name: "Chih-hao", teams: ["Ecuador", "Sweden"] },
  { name: "Noela", teams: ["Netherlands", "Japan"] },
  { name: "Erik", teams: ["Egypt", "Norway"] },
  { name: "Francesco", teams: ["New Zealand", "Colombia"] },
  { name: "Dave", teams: ["Spain", "Austria"] },
  { name: "Edwin", teams: ["Uruguay", "Senegal"] },
  { name: "Yash", teams: ["Algeria", "Portugal"] },
  { name: "Thav", teams: ["Iraq", "Ghana"] },
];

// Teams that have been eliminated — update this list as the tournament progresses.
// Once both of a participant's teams appear here they are removed from the rankings.
export const ELIMINATED: string[] = [];

export const GROUPS: Record<string, string[]> = {
  A: ["Mexico", "South Africa", "South Korea", "Czechia"],
  B: ["Canada", "Bosnia", "Qatar", "Switzerland"],
  C: ["Brazil", "Morocco", "Haiti", "Scotland"],
  D: ["USA", "Paraguay", "Australia", "Turkiye"],
  E: ["Germany", "Curacao", "Ivory Coast", "Ecuador"],
  F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
  G: ["Belgium", "Egypt", "Iran", "New Zealand"],
  H: ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
  I: ["France", "Senegal", "Iraq", "Norway"],
  J: ["Argentina", "Algeria", "Austria", "Jordan"],
  K: ["Portugal", "DR Congo", "Uzbekistan", "Colombia"],
  L: ["England", "Croatia", "Ghana", "Panama"],
};
