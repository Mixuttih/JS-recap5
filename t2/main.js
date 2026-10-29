const API_URL = "https://reqres.in/api/users";
const API_KEY = "*";
const user = {
  name: "Jorma Jormala",
  job: "Tyämiäs",
};

async function createUser() {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const createdUser = await response.json();
    console.log(createdUser);
  }
  catch (error) {
    console.error("Unable to create user:", error);
  }
}

createUser();