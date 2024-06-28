'use strict';

// let map,mapEvent;

// Workout Display //

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat , lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November','December'];

    // console.log(months[this.date.getMonth()]);
    // prettier-ignore
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

// Running Box Display //
class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  // calculation //
  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// CYcling Box Display //
class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calSpeed();
    this._setDescription();
  }

  calSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([39 , -12] , 5.2 , 24, 178);
// const cycling1 = new Cycling([39 , -12] , 27 , 95, 523);

// console.log(run1 , cycling1);

//////////////////////////////////////////////////////
// APPLICATION ARCHITECTURE //
//////////////////////////////////////////////////////

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const btnDeleteAll = document.querySelector('.reset_logo');

class App {
  // Private Instance Property //
  #map;
  #mapEvent;
  #workout = [];
  #mapZoomLevel = 13;
  #workoutMarkers = {};
  #editWorkout;

  constructor() {
    // Get user's position
    this._getPosition();

    this.workoutMarkers = {};
    // console.log(this.workoutMarkers);

    // Get data from LocalStorage
    this._getLocalStorage();

    // Attach Event Handler
    form.addEventListener('submit', this._newWrokout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);

    containerWorkouts.addEventListener('click', this._moveToPop.bind(this));

    // Point : Event handler for Edit and Delete Buttons
    containerWorkouts.addEventListener(
      'click',
      function (e) {
        if (e.target.classList.contains('edit__icon')) {
          this._editWorkout(e);
        }
        if (e.target.classList.contains('delete__icon')) {
          this._deleteWorkout(e);
        }
      }.bind(this)
    );

    // containerWorkouts.addEventListener('click', this._deleteWorkout.bind(this));
    // containerWorkouts.addEventListener('click', this._editWorkout.bind(this));

    // Point : Event handler for delete all workouts
    btnDeleteAll.addEventListener('click', this._deleteAllWorkout.bind(this));
  }

  _getPosition() {
    // Geolocation API //

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could Not get your Position');
        }
      );
    }
  }

  _loadMap(position) {
    // console.log(position);

    const { latitude } = position.coords;
    const { longitude } = position.coords;

    // console.log(
    //   `https://www.google.co.in/maps/place/Rajkot,+Gujarat/@${latitude},${longitude}`
    // );

    const coords = [latitude, longitude];

    // Leaflet Library //
    // console.log(this);
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    // console.log(this.#map);

    // L.tileLayer('https://tile.openstreetmap.fr/hot//{z}/{x}/{y}.png', {
    //   attribution:
    //     '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    // }).addTo(this.#map);

    L.tileLayer('http://{s}.googleapis.com/vt?lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Form view //
    // Handling click on Map //

    this.#map.on('click', this._showForm.bind(this));

    // render the marker
    this.#workout.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // Empty inputs
    // prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =' ';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWrokout(e) {
    // Helper function //

    const validInput = (...inputs) => inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();
    // console.log(this);

    // Get data from form //

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //If Workout Running , create Running Object //
    if (type === 'running') {
      const cadence = +inputCadence.value;

      // Check if data is valid //
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInput(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Input have to be positive number!☠️');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //If workout Cycling , create Cycling  Object //
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      // Check if data is valid //

      if (
        !validInput(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Input have to be positive number!☠️');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    if (this.#editWorkout) {
      this._updateWorkout();
    } else {
      // Add new object to workout array //
      this.#workout.push(workout);
      // console.log(workout);

      // Render workout on map as Marker
      this._renderWorkoutMarker(workout);

      // Render workout on List
      this._renderWorkout(workout);

      //  console.log(this.#mapEvent);

      // Set LocalStorage to all workout
      this._setLocalStorage();

      // hide form + clear input filed //
      //prettier-ignore
      this._hideForm();

      // Point Delete all button visibility
      this.updateDeleteAllButtonVisibility();
    }
  }

  _renderWorkoutMarker(workout) {
    // Display Marker//
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();

    // Circle view //
    if (this.#mapEvent != undefined) {
      this.#map.removeLayer(this.#mapEvent);
    }

    this.#mapEvent = L.circle(workout.coords, 1000, {
      color: 'steelblue',
      fillOpacity: 0.2,
      opacity: 0.5,
      fillColor: 'steelblue',
    }).addTo(this.#map);
  }

  _renderWorkout(workout) {
    // prettier-ignore
    let html = `
                         <li class="workout workout--${workout.type}" data-id="${workout.id}">
                            <h2 class="workout__title">${workout.description}</h2>
                            <div class="workout-icons-action">
                                <span class="workout__icon edit__icon"  data-id="${workout.id}" style = "color: #69E2FF;">
                                Edit
                                </span>
                                <span class="workout__icon  delete__icon" data-id="${workout.id}" style = "color: #e53935;">
                                Delete 
                                </span>

                                </div>
                            <div class="workout__details">
                                <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
                                <span class="workout__value">${workout.distance}</span>
                                <span class="workout__unit">km</span>
                            </div>
                            <div class="workout__details">
                                <span class="workout__icon">⏱</span>
                                <span class="workout__value">${workout.duration}</span>
                                <span class="workout__unit">min</span>
                            </div>`;

    if (workout.type === 'running') {
      html += ` 
         <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
    }

    if (workout.type === 'cycling') {
      html += ` 
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.elevationGain}</span>
                <span class="workout__unit">m</span>
          </div>
        </li>`;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPop(e) {
    const workoutEl = e.target.closest('.workout');
    // console.log(workoutEl);

    if (!workoutEl) return;

    const workout = this.#workout.find(
      work => work.id === workoutEl.dataset.id
    );
    // console.log(workout);

    this.#map.setView(workout.coords, this.#mapZoomLevel),
      {
        animate: true,
        pan: {
          duration: 1,
        },
      };

    // // using the Public Interface
    // workout.click();
  }

  // LocalStorage //

  // JSON.stringify() => Object convert to String
  // JSON.parse() => String convert to Object

  // Set the item in LocalStorage
  _setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this.#workout));
  }

  // Get the item in LocalStorage
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));
    // console.log(data);

    if (!data) return;

    this.#workout = data;

    this.#workout.forEach(work => {
      this._renderWorkout(work);
    });
  }

  ////////////////////////////////////////////////////
  // Edit Workout

  _editWorkout(e) {
    const editEl = e.target.closest('.edit__icon');
    // console.log('edit clicked');

    if (!editEl) return; // Guard clause

    const editId = editEl.dataset.id;

    const workoutIndex = this.#workout.findIndex(work => work.id === editId);

    // console.log(workoutIndex);

    if (workoutIndex === -1) return; // Workout is not found

    const workout = this.#workout[workoutIndex];

    inputType.value = workout.type;
    inputDistance.value = workout.distance;
    inputDuration.value = workout.duration;

    if (workout.type === 'running') {
      inputElevation.value = '';
      inputCadence.value = workout.cadence;
    } else if (workout.type === 'cycling') {
      inputElevation.value = workout.elevationGain;
      inputCadence.value = '';
    }
    // Set the edited workout as the current edit workout
    this.#editWorkout = workout;

    // Show the form
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  ////////////////////////////////////////////////////
  // Update workout

  _updateWorkout() {
    if (!this.#editWorkout) {
      console.error('No workout to update.');
      return;
    }

    if (!this.#mapEvent || !this.#mapEvent.latlng) {
      console.error('Map event or latlng is undefined');
      return;
    }

    const workoutId = this.#editWorkout.id;
    const workoutIndex = this.#workout.findIndex(work => work.id === workoutId);

    // console.log(workoutIndex);

    if (workoutIndex === -1) {
      console.error('workout not found');
      return;
    }

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const coords = this.#mapEvent.latlng;

    this.#workout[workoutIndex].type = type;
    this.#workout[workoutIndex].distance = distance;
    this.#workout[workoutIndex].duration = duration;
    this.#workout[workoutIndex].coords = coords;

    if (type === 'running') {
      const cadence = +inputCadence.value;
      this.#workout[workoutIndex].cadence = cadence;
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      this.#workout[workoutIndex].elevationGain = elevation;
    }

    //Update the workout in the list
    this._removeWorkoutMarker(workoutId);
    this._removeWorkoutMarker(this.#workout[workoutIndex]);

    const workoutElement = document.querySelector(`[data-id="${workoutId}"]`);

    if (workoutElement) {
      workoutElement.remove();
    }

    this._renderWorkout(this.#workout[workoutIndex]);

    //hide the form

    this._hideForm();

    //Update local Storage with the updated workout

    this._setLocalStorage();

    //clear the edit workout flag
    this.#editWorkout = null;

    console.log('Workout Updated Successfully ');
  }

  ////////////////////////////////////////////////////
  // delete workout

  _deleteWorkout(e) {
    // e.preventDefault();
    const deleteEl = e.target.closest('.delete__icon');
    // console.log('delete clicked');
    alert('Are sure delete this Workout ⛔');

    if (!deleteEl) return;

    const deleteId = deleteEl.dataset.id;

    const workoutIndex = this.#workout.findIndex(work => work.id === deleteId);

    if (workoutIndex === -1) return; // Workout not found

    // Remove workout from array
    this.#workout.splice(workoutIndex, 1);

    // Remove workout marker from the map
    this._removeWorkoutMarker(deleteId);

    // Set local storage to all workouts
    this._setLocalStorage();

    // reload form
    location.reload();

    // console.log(workoutIndex);
  }

  // Point : Delete workout
  _removeWorkoutMarker(id) {
    const marker = this.workoutMarkers[id];
    if (marker) {
      marker.remove();
      delete this.workoutMarkers[id];
    }
  }

  // Delete All the workout

  _deleteAllWorkout() {
    if (confirm('Are you sure you want to delete all workouts?')) {
      // Clear the workouts array
      this.#workout = [];

      // Remove all workout markers from the map
      for (const id in this.workoutMarkers) {
        this._removeWorkoutMarker(id);
      }

      // Clear the local storage
      this._setLocalStorage();

      // Remove all workout elements from the UI
      const workoutElements = document.querySelectorAll('.workout');
      workoutElements.forEach(element => element.remove());

      // Point Delete all button visibility
      this.updateDeleteAllButtonVisibility();

      location.reload();
    } else {
      console.log('Delete all workouts cancelled.');
    }
  }

  // Point : Showing Delete All button only when there are more than 2 workouts
  updateDeleteAllButtonVisibility() {
    if (this.#workout.length >= 2) {
      btnDeleteAll.style.display = 'block'; // Show the button
    } else {
      btnDeleteAll.style.display = 'none'; // Hide the button
    }
  }
}

const app = new App();
// app._getPosition();
