const socket = io('http://localhost:5050', { path: '/real-time' });

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
		document.getElementById('selectVehicle').style.display = 'block';
	}
});

document.getElementById('registerCarBtn').addEventListener('click', () => {
	const carName = document.getElementById('carName').value;
	const userName = document.getElementById('userName').value;
	if (carName) {
		socket.emit('registerCar', { userName, carName });
		document.getElementById('selectVehicle').style.display = 'none';
		document.getElementById('waiting').style.display = 'block';
	}
});

socket.on('newTrip', (trip) => {
	console.log('New trip received:', trip);
	const tripRequests = document.getElementById('tripRequests');
	const tripCard = document.createElement('div');
	tripCard.className = 'trip-card';
	tripCard.innerHTML = `
        <h3>Viaje desde ${trip.origin} hasta ${trip.destination}</h3>
        <p>Pasajero: ${trip.userName}</p>
        <button onclick="acceptTrip('${trip.id}')">Aceptar Viaje</button>
    `;
	tripRequests.appendChild(tripCard);
});

function acceptTrip(tripId) {
	socket.emit('acceptTrip', tripId);
	alert('Viaje aceptado. Preparado para empezar.');
	document.getElementById('tripRequests').innerHTML = '';
}

socket.on('tripAccepted', (trip) => {
	document.getElementById('waiting').style.display = 'none';
	const tripControls = document.getElementById('tripControls');
	tripControls.style.display = 'block';
	tripControls.innerHTML = `
        <h3>Viaje desde ${trip.origin} hasta ${trip.destination}</h3>
        <p>Pasajero: ${trip.userName}</p>
        <p>Vehículo: ${trip.carName}</p>
        <button id="startTripBtn">Iniciar Viaje</button>
    `;

	// Añadiendo event listener después de crear el botón en el DOM
	document.getElementById('startTripBtn').addEventListener('click', () => {
		socket.emit('startTrip', trip.id);
		console.log('Iniciando viaje', trip);
		alert('Viaje iniciado. ¡Buen viaje!');
	});
});

socket.on('tripUpdate', (data) => {
	const tripControls = document.getElementById('tripControls');
	tripControls.innerHTML = `<h3>Estado del viaje: ${data.status}</h3>`;

	if (data.status === 'inProgress') {
		console.log('In trip = in progress');
		tripControls.innerHTML += `<button id="endTripBtn">Finalizar Viaje</button>`;

		// Añadiendo event listener para finalizar el viaje
		document.getElementById('endTripBtn').addEventListener('click', () => {
			socket.emit('endTrip', data.trip.id);
			console.log('end trip driver', data, data.trip.id);
			alert('Viaje finalizado. ¡Gracias por usar ECOUber!');
		});
	}
});

