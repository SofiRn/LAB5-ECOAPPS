const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.json());
app.use(cors());

const httpServer = createServer(app);

const io = new Server(httpServer, {
	path: '/real-time',
	cors: {
		origin: '*', // Allow requests from any origin
	},
});

let availableCars = [];
let alltrips = [];
let activeTrips = [];

const db = {
	players: [],
};

app.get('/', (request, response) => {
	response.send('Hola');
});

app.get('/users', (request, response) => {
	response.send(db);
	io.emit('chat-messages', 'Hola desde el servidor'); // I can emit events to all connected clients from a single endpoint
});

app.post('/user', (request, response) => {
	const { body } = request;
	db.players.push(body);
	response.status(201).send(body); // We return the same object received and also I send a code 201 which means an object was created
});

// Serve static files for both driver and passenger
app.use('/driver', express.static('driver'));
app.use('/passenger', express.static('passenger'));

io.on('connection', (socket) => {
	console.log('New client connected:', socket.id);

	// Evento para registrar un conductor
	socket.on('registerCar', ({ userName, carName }) => {
		const car = { id: socket.id, userName, carName };
		availableCars.push(car);
		io.emit('updateCars', availableCars); // Enviar actualización a todos los clientes
		console.log('Updated cars list:', availableCars);
	});

	// Evento para solicitar un viaje
	socket.on('requestTrip', ({ userName, origin, destination }) => {
		const trip = { id: socket.id, userName, origin, destination };
		alltrips.push(trip);
		activeTrips.push(trip);
		io.emit('newTrip', trip); // Enviar nuevo viaje a todos los conductores
	});

	socket.on('acceptTrip', (tripId) => {
		const trip = activeTrips.find((trip) => trip.id === tripId);
		if (trip) {
			trip.driverId = socket.id;
			const driver = availableCars.find((car) => car.id === socket.id);
			trip.driverName = driver.userName;
			trip.carName = driver.carName;

			// Remove the trip from activeTrips and car from availableCars
			activeTrips = activeTrips.filter((trip) => trip.id !== tripId);
			availableCars = availableCars.filter((car) => car.id !== socket.id);

			// Notificar que el viaje fue aceptado
			io.to(tripId).emit('tripAccepted', trip);
			io.to(socket.id).emit('tripAccepted', trip);
			io.emit('updateCars', availableCars); // Actualizar la lista de coches disponibles

			// Eliminar el mensaje de espera
			io.emit('tripConfirmed', { tripId, driverId: socket.id }); // Confirmar el viaje a ambos
		}
	});

	socket.on('selectDriver', ({ tripId, driverId }) => {
		const trip = activeTrips.find((trip) => trip.id === tripId);
		const driver = availableCars.find((car) => car.id === driverId);

		if (trip && driver) {
			trip.driverId = driverId;
			trip.driverName = driver.userName;
			trip.carName = driver.carName;

			io.to(driverId).emit('tripSelected', trip); // Notifica al conductor
			io.to(tripId).emit('tripConfirmed', trip); // Notifica al pasajero

			// Actualizamos la interfaz del pasajero para que salga de la espera
			io.to(tripId).emit('tripUpdate', { status: 'Conductor seleccionado', trip });

			console.log(`Trip with ID ${tripId} has been assigned to driver ${driverId}`);
		} else {
			console.log('Trip or driver not found');
		}
	});

	socket.on('startTrip', (tripId) => {
		const trip = alltrips.find((trip) => trip.id === tripId);
		console.log('trips', alltrips);

		console.log('se inició el viaje');
		if (trip) {
			console.log('trip existe');
			trip.status = 'inProgress';
			console.log('emit in progress', trip.status);
			io.to(trip.id).emit('tripUpdate', { status: 'inProgress', trip });
			io.to(trip.driverId).emit('tripUpdate', { status: 'inProgress', trip });
			console.log('trip emit in progress', trip);
			console.log(`El viaje con ID ${tripId} está en curso.`);
		}
	});

	socket.on('endTrip', (tripId) => {
		const tripIndex = alltrips.findIndex((trip) => trip.id === tripId);
		console.log('viaje end in sever', tripId, tripIndex);
		if (tripIndex !== -1) {
			const trip = alltrips.splice(tripIndex, 1)[0];
			io.to(trip.id).emit('tripUpdate', { status: 'Viaje finalizado', trip });
			console.log('trip state end', trip);
			io.emit('tripFinished', tripId);
			console.log(`El viaje con ID ${tripId} ha finalizado.`);
		}
	});

	socket.on('disconnect', () => {
		console.log('Client disconnected:', socket.id);
		availableCars = availableCars.filter((car) => car.id !== socket.id);
		activeTrips = activeTrips.filter((trip) => trip.id !== socket.id);
		io.emit('updateCars', availableCars); // Actualizar lista de coches disponibles
	});
});

const port = 5050;

httpServer.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
