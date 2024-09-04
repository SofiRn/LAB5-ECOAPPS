// const socket = io();
const socket = io('http://localhost:5050', { path: '/real-time' });
// const socket = io('http://localhost:3000');

socket.on('connect', () => {
	console.log('Connected to server');
});

socket.on('disconnect', () => {
	console.log('Disconnected from server');
});

document.getElementById('loginBtn').addEventListener('click', () => {
	const userName = document.getElementById('userName').value;
	if (userName) {
		document.getElementById('login').style.display = 'none';
		document.getElementById('requestTrip').style.display = 'block';
	}
});

document.getElementById('requestTripBtn').addEventListener('click', () => {
	const origin = document.getElementById('origin').value;
	const destination = document.getElementById('destination').value;
	const userName = document.getElementById('userName').value;
	if (origin && destination) {
		socket.emit('requestTrip', { userName, origin, destination });
		document.getElementById('requestTrip').style.display = 'none';
		document.getElementById('waiting').style.display = 'block';
	}
});

socket.on('updateCars', (availableCars) => {
	let carOptions = '';
	availableCars.forEach((car) => {
		carOptions += `<option value="${car.id}">${car.userName} - ${car.carName}</option>`;
	});
	document.getElementById('availableCars').innerHTML = carOptions;
});


socket.on('updateCars', (availableCars) => {
	let carOptions = '';
	availableCars.forEach((car) => {
		carOptions += `<option value="${car.id}">${car.userName} - ${car.carName}</option>`;
	});
	document.getElementById('availableCars').innerHTML = carOptions;
	// document.getElementById('waiting').style.display = 'none';
	// document.getElementById('selectDriver').style.display = 'block';
});



document.getElementById('selectDriverBtn').addEventListener('click', () => {
	const selectedDriverId = document.getElementById('availableCars').value;
	socket.emit('selectDriver', { tripId: socket.id, driverId: selectedDriverId });
});


socket.on('tripAccepted', (trip) => {
	alert(`Su viaje con ${trip.driverName} ha sido aceptado. ¡En camino!`);
	document.getElementById('waiting').style.display = 'none';
	document.getElementById('tripStatus').style.display = 'block';
	document.getElementById('tripStatus').innerHTML = `
        <h3>Estado del Viaje: En curso</h3>
        <p>Conductor: ${trip.driverName}</p>
        <p>Vehículo: ${trip.carName}</p>
    `;
});

socket.on('tripUpdate', (data) => {
	document.getElementById('tripStatus').innerText = `Estado del viaje: ${data.status}`;
});

