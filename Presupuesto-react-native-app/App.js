import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PresupuestScreen from './screens/PresupuestScreen';
import AhorroScreen from './screens/AhorroScreen';

export default function App() {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contrasenaUsuario, setContrasenaUsuario] = useState('');
  const [usuarios, setUsuarios] = useState({});
  const [logueado, setLogueado] = useState(false);
  const [pantalla, setPantalla] = useState('inicio'); // 🔹 controla qué pantalla mostrar

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const data = await AsyncStorage.getItem('usuarios_registrados');
        if (data) setUsuarios(JSON.parse(data));
      } catch (error) {
        console.error('Error cargando usuarios:', error);
      }
    };
    cargarUsuarios();
  }, []);

  const guardarUsuarios = async (nuevosUsuarios) => {
    try {
      await AsyncStorage.setItem('usuarios_registrados', JSON.stringify(nuevosUsuarios));
    } catch (error) {
      console.error('Error guardando usuarios:', error);
    }
  };

  const manejarRegistro = () => {
    if (!nombreUsuario || !contrasenaUsuario) {
      Alert.alert('Error', 'Por favor ingresa un nombre y una contraseña.');
      return;
    }

    if (usuarios[nombreUsuario]) {
      Alert.alert('Error', 'Este usuario ya está registrado.');
      return;
    }

    const nuevosUsuarios = { ...usuarios, [nombreUsuario]: contrasenaUsuario };
    setUsuarios(nuevosUsuarios);
    guardarUsuarios(nuevosUsuarios);

    Alert.alert('✅ Registro exitoso', `Bienvenido ${nombreUsuario}`, [
      { text: 'Continuar', onPress: () => { setLogueado(true); setPantalla('finanzas'); } },
    ]);
  };

  const manejarLogin = () => {
    if (!nombreUsuario || !contrasenaUsuario) {
      Alert.alert('Error', 'Ingresa tu nombre y contraseña.');
      return;
    }

    if (!usuarios[nombreUsuario]) {
      Alert.alert('Error', 'Usuario no encontrado. Regístrate primero.');
      return;
    }

    if (usuarios[nombreUsuario] !== contrasenaUsuario) {
      Alert.alert('Error', 'Contraseña incorrecta.');
      return;
    }

    Alert.alert('👋 Bienvenido de nuevo', `Hola ${nombreUsuario}`, [
      { text: 'Continuar', onPress: () => { setLogueado(true); setPantalla('finanzas'); } },
    ]);
  };

  const volverInicio = () => {
    setLogueado(false);
    setNombreUsuario('');
    setContrasenaUsuario('');
    setPantalla('inicio');
  };

  // 🔹 Control de pantallas
  if (logueado) {
    if (pantalla === 'finanzas') {
      return (
        <PresupuestScreen
          nombreUsuario={nombreUsuario}
          contrasenaUsuario={contrasenaUsuario}
          onIrAhorros={() => setPantalla('ahorros')}
          onVolverInicio={volverInicio}
        />
      );
    }

    if (pantalla === 'ahorros') {
      return (
        <AhorroScreen
          nombreUsuario={nombreUsuario}
          onVolverFinanzas={() => setPantalla('finanzas')}
        />
      );
    }
  }

  // 🔹 Pantalla de inicio (login/registro)
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>💰 Cash Run</Text>
      <Text style={styles.subtitulo}>Inicia sesión o regístrate</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre de usuario"
        value={nombreUsuario}
        onChangeText={setNombreUsuario}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={contrasenaUsuario}
        onChangeText={setContrasenaUsuario}
      />

      <View style={styles.botones}>
        <Button title="Iniciar sesión" onPress={manejarLogin} color="#2563EB" />
        <View style={{ height: 10 }} />
        <Button title="Registrarse" onPress={manejarRegistro} color="#10B981" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#F9FAFB',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#1E3A8A',
  },
  subtitulo: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#4B5563',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  botones: {
    marginTop: 10,
  },
});
