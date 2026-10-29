const API_URL = "https://reqres.in/api/users/1";
const API_KEY = "*";

async function fetchUser() {
  try {
    const response = await fetch(API_URL, {
      headers: {
        "x-api-key": API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const user = await response.json();
    console.log(user);
  }
  catch (error) {
    console.error("Unable to fetch user data:", error);
  }
}

fetchUser();