async function getSteamAppDetails(appid) {
  const response = await fetch(
    `https://store.steampowered.com/api/appdetails?appids=${appid}`
  );

  if (!response.ok) {
    throw new Error(`Steam API request failed with status ${response.status}`);
  }

  const json = await response.json();
  const appEntry = json[String(appid)];

  if (!appEntry || !appEntry.success || !appEntry.data) {
    return null;
  }

  return appEntry.data;
}

module.exports = {
  getSteamAppDetails,
};