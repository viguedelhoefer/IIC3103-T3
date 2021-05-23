import './App.css';
import React, {useState, useEffect, Fragment} from 'react';
import io from 'socket.io-client';
import {MapContainer, TileLayer, Marker, Popup, Polyline, Circle} from 'react-leaflet';
import L from 'leaflet';
import Grid from '@material-ui/core/Grid';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { Container } from '@material-ui/core';

function App() {

  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");

  const [chatBubble, setChatBubble] = useState([])

  const [vuelos, setVuelos] = useState([]);

  const [positions, setPositions] = useState({});

  const [socket] = useState(io("wss://tarea-3-websocket.2021-1.tallerdeintegracion.cl", {
    path: '/flights',
    autoConnect: false,
    transports: ['websocket']
  }));

  useEffect(() => {
    socket.connect();
    socket.on('connect', () => {
      console.log('connected');
      socket.emit('FLIGHTS');
    });
    socket.on('FLIGHTS', (data) => {
      console.log(data);
      setVuelos(data);
      data.forEach((flight) => {
        setPositions({...positions, [flight.code]:[[0,0]] })
      });
    });
    socket.on('POSITION', (data) => {
      setPositions((positions) => { return {...positions, [data.code]: [data.position] } })
    });
    socket.on('CHAT', (data) => {
      console.log(data);
      data.date = new Date(data.date);
      data.date = data.date.toUTCString();
      console.log(data.date);
      setChatBubble((messages) => { return [...messages, data]});
    });
    return () => socket.disconnect(console.log('disconnected'));
    // eslint-disable-next-line
  }, [socket]);

  const emitFlights = () => {
    socket.emit('FLIGHTS');
  }

  const emitChat = () => {
    socket.emit('CHAT', {name: username, message: message});
  }

  const colors = ['blue', 'red', 'purple', 'green'];
  var Icono = L.Icon.extend({
    options: {
      className: "asd",
      iconUrl: "https://i0.wp.com/p7.hiclipart.com/preview/352/395/627/flight-frequent-flyer-program-travel-airline-mango-vector-silver-flying-plane-plane.jpg",
      iconSize: [50,50]
    }
  })
  const MyIcon = new Icono();

  return (
    <div>
      <Grid container>
      <h1>Rutas en vivo</h1>
      <div style={{display: "flex", justifyContent: "center", position: "relative"}}>
        <div className="Map-class">
        <MapContainer center={[-33.4513, -70.6653]} zoom={5} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {vuelos.map((info, idx) => (
            <Fragment>
            <Polyline color={colors[idx % colors.length]} positions={[info.origin, info.destination]} dashArray={'5'}/>
            <Circle color={colors[idx % colors.length]} center={info.origin} radius={20000}>
              <Popup>
                Aeropuerto de origen: {info.origin} <br />
                Vuelo: {info.code} <br />
                Aerolinea: {info.airline}
              </Popup>
            </Circle>
            <Circle color={colors[idx % colors.length]} center={info.destination} radius={20000}>
              <Popup>
                Aeropuerto de destino: {info.destination} <br />
                Vuelo: {info.code} <br />
                Aerolinea: {info.airline}
              </Popup>
            </Circle>
            </Fragment>
          ))}
          {Object.entries(positions).map(([key, value]) => (
              <Marker position={value[0]} marker_index={key} icon={MyIcon}>
                <Popup>
                  Codigo: {key} <br />
                  Coordenadas Actuales: {value[0][0]},{value[0][1]}
                </Popup>
              </Marker>
            ))}
        </MapContainer>
        </div>
        <Container>
          <h3>Chat</h3>
          <div style={{height:'350px',  overflow: "scroll", width: '500px'}}>
            {chatBubble.map((info) => (
              <div style={{borderColor: 'black', borderStyle: 'solid'}}>
              <p>Fecha: {info.date}</p>
              <p>Nombre: {info.name}</p>
              <p>Mensaje: {info.message}</p>
              </div>
            ))}
          </div>
          <div style={{height: '100px'}}>
          <input type="text" placeholder="Username..." value={username} 
          onChange={(e) => setUsername(e.target.value)} />
          <input type="text" placeholder="Message..." value={message}
          onChange={(e)=> setMessage(e.target.value)} />
          <button onClick={emitChat}>Enviar Mensaje</button>
          </div>
        </Container>
      </div>
      <div style={{display: "flex", justifyContent: "center", position: "relative"}}>
        <h3 style={{textAlign: "center"}}>Informacion de los vuelos</h3>
        <button onClick={emitFlights}>Actualizar Informacion</button>
      </div>
      </Grid>
      <TableContainer component={Paper}>
      <Table style={{minWidth: 450}} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell align="center">Aerolinea</TableCell>
            <TableCell align="center">Codigo&nbsp;Vuelo</TableCell>
            <TableCell align="center">Avion</TableCell>
            <TableCell align="center">Asientos</TableCell>
            <TableCell align="center">Coordenadas&nbsp;Inicio</TableCell>
            <TableCell align="center">Coordenadas&nbsp;Fin</TableCell>
            <TableCell align="center">Pasajeros</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vuelos.map((info) => (
            <TableRow>
              <TableCell align="center">{info.airline}</TableCell>
              <TableCell align="center">{info.code}</TableCell>
              <TableCell align="center">{info.plane}</TableCell>
              <TableCell align="center">{info.seats}</TableCell>
              <TableCell align="center">{info.origin[0]},{info.origin[1]}</TableCell>
              <TableCell align="center">{info.destination[0]},{info.destination[1]}</TableCell>
              <TableCell align="center">
              {info.passengers.map((pass) => (
                <p>Nombre: {pass.name} <br /> Edad: {pass.age}</p>
              ))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    </div>
  );
}

export default App;
