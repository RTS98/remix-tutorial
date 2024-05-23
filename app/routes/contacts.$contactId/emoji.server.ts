export async function fetchEmoji() {
  return fetch(
    "https://emojihub.yurace.pro/api/all/category/travel-and-places"
  ).then((res) => res.json());
}
