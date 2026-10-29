const API_BASE_URL =
  'https://media2.edu.metropolia.fi/restaurant/api/v1';
const RESTAURANTS_URL = `${API_BASE_URL}/restaurants`;
const DAILY_MENU_URL = restaurantId =>
  `${API_BASE_URL}/restaurants/daily/${restaurantId}/en`;

const table = document.querySelector('table');
const dialog = document.querySelector('dialog');
const statusMessage = document.querySelector('#status-message');
let menuRequestController;

const showStatus = (message, isError = false) => {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', isError);
};

const requestJson = async (url, options) => {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
};

const getRestaurants = async () => {
  const data = await requestJson(RESTAURANTS_URL);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.restaurants)) {
    return data.restaurants;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  throw new Error('The restaurant response did not contain a restaurant list');
};

const getDailyMenu = async (restaurantId, signal) => {
  const data = await requestJson(DAILY_MENU_URL(restaurantId), {signal});

  if (!data || !Array.isArray(data.courses)) {
    throw new Error('The daily menu response did not contain a menu');
  }

  return data.courses;
};

const createDetailRow = (label, value) => {
  const term = document.createElement('dt');
  const description = document.createElement('dd');
  term.textContent = label;
  description.textContent = value || 'Not available';
  return [term, description];
};

const renderRestaurantDialog = restaurant => {
  dialog.replaceChildren();

  const heading = document.createElement('h2');
  heading.textContent = restaurant.name || 'Restaurant';
  dialog.appendChild(heading);

  const details = document.createElement('dl');
  [
    ['Address', restaurant.address],
    ['Postal code', restaurant.postalCode],
    ['City', restaurant.city],
    ['Phone number', restaurant.phone],
    ['Company', restaurant.company],
  ]
    .flatMap(([label, value]) => createDetailRow(label, value))
    .forEach(element => details.appendChild(element));
  dialog.appendChild(details);

  const menu = document.createElement('section');
  menu.className = 'daily-menu';
  const loadingMessage = document.createElement('p');
  loadingMessage.textContent = "Loading today's menu...";
  menu.appendChild(loadingMessage);
  dialog.appendChild(menu);

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'close-button';
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', () => dialog.close());
  dialog.appendChild(closeButton);

  return menu;
};

const renderDailyMenu = (menuContainer, courses) => {
  menuContainer.replaceChildren();

  const heading = document.createElement('h3');
  heading.textContent = "Today's menu";
  menuContainer.appendChild(heading);

  if (courses.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'No menu available today.';
    menuContainer.appendChild(emptyMessage);
    return;
  }

  const menuList = document.createElement('ul');
  courses.forEach(course => {
    const menuItem = document.createElement('li');
    const courseName = document.createElement('strong');
    courseName.textContent = course.name;
    menuItem.appendChild(courseName);

    if (course.price || course.diets) {
      const details = document.createElement('span');
      details.textContent = ` - ${course.price || ''}${
        course.price && course.diets ? ', ' : ''
      }${course.diets || ''}`;
      menuItem.appendChild(details);
    }

    menuList.appendChild(menuItem);
  });
  menuContainer.appendChild(menuList);
};

const renderRestaurants = restaurants => {
  const sortedRestaurants = [...restaurants].sort((first, second) =>
    (first.name || '').localeCompare(second.name || ''),
  );

  sortedRestaurants.forEach(restaurant => {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    const addressCell = document.createElement('td');

    nameCell.textContent = restaurant.name || 'Unnamed restaurant';
    nameCell.classList.add('restaurant-name');
    nameCell.addEventListener('click', async () => {
      menuRequestController?.abort();
      menuRequestController = new AbortController();

      document
        .querySelectorAll('.restaurant-name')
        .forEach(element => element.classList.remove('highlight'));
      nameCell.classList.add('highlight');

      const menuContainer = renderRestaurantDialog(restaurant);
      dialog.showModal();

      try {
        const courses = await getDailyMenu(
          restaurant._id,
          menuRequestController.signal,
        );
        renderDailyMenu(menuContainer, courses);
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        menuContainer.textContent = `Unable to load today's menu: ${error.message}`;
      }
    });

    addressCell.textContent = restaurant.address;
    row.appendChild(nameCell);
    row.appendChild(addressCell);
    table.appendChild(row);
  });
};

dialog.addEventListener('close', () => {
  document
    .querySelectorAll('.restaurant-name')
    .forEach(element => element.classList.remove('highlight'));
});

const loadRestaurants = async () => {
  showStatus('Loading restaurants...');

  try {
    const restaurants = await getRestaurants();
    renderRestaurants(restaurants);
    showStatus(`${restaurants.length} restaurants loaded.`);
  } catch (error) {
    showStatus(`Unable to load restaurants: ${error.message}`, true);
  }
};

loadRestaurants();
