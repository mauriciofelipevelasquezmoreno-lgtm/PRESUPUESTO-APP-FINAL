import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AhorroScreen({ nombreUsuario, contrasenaUsuario, onVolverFinanzas }) {
  const claveAhorros = `ahorros_${nombreUsuario}_${contrasenaUsuario}`;
  const claveFinanzas = `finanzas_${nombreUsuario}_${contrasenaUsuario}`;

  const [metas, setMetas] = useState([]);
  const [nombreMeta, setNombreMeta] = useState('');
  const [montoMeta, setMontoMeta] = useState('');
  const [montoAhorro, setMontoAhorro] = useState('');
  const [ahorrosPendientes, setAhorrosPendientes] = useState([]); // 💡 Nuevos ahorros detectados

  // 🔹 Limpia números con comas, puntos o espacios
  const limpiarNumero = (valor) => {
    if (valor == null) return 0;
    const str = String(valor);
    const limpio = str.replace(/[.,\s]/g, '');
    const n = parseFloat(limpio);
    return isNaN(n) ? 0 : n;
  };

  // 🔹 Cargar metas guardadas
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const datos = await AsyncStorage.getItem(claveAhorros);
        if (datos) {
          const parsed = JSON.parse(datos);
          const metasCargadas = parsed.map((m) => {
            const historial = Array.isArray(m.historial) ? m.historial.map((x) => Number(x) || 0) : [];
            const ahorradoCalc = historial.reduce((acc, v) => acc + v, 0);
            return {
              id: m.id ?? Date.now(),
              nombre: m.nombre ?? 'Meta',
              meta: typeof m.meta === 'number' ? m.meta : limpiarNumero(m.meta),
              historial,
              ahorrado: ahorradoCalc,
            };
          });
          setMetas(metasCargadas);
        }
      } catch (error) {
        console.error('Error cargando ahorros:', error);
      }
    };
    cargarDatos();
  }, []);

  // 🔹 Cargar ahorros pendientes desde Finanzas (categoría “Ahorro”)
  useEffect(() => {
    const cargarAhorrosPendientes = async () => {
      try {
        const finanzasGuardadas = await AsyncStorage.getItem(claveFinanzas);
        if (finanzasGuardadas) {
          let fin = JSON.parse(finanzasGuardadas);
          if (Array.isArray(fin)) fin = fin[0] || {};

          const movimientos = Array.isArray(fin.movimientos) ? fin.movimientos : [];
          const pendientes = movimientos.filter((m) => m.categoria === 'Ahorro' && !m.asignadoMeta);
          setAhorrosPendientes(pendientes);
        }
      } catch (error) {
        console.error('Error cargando ahorros pendientes:', error);
      }
    };
    cargarAhorrosPendientes();
  }, [metas]);

  // 🔹 Guardar metas
  const guardarMetas = async (nuevasMetas) => {
    try {
      await AsyncStorage.setItem(claveAhorros, JSON.stringify(nuevasMetas));
      setMetas(nuevasMetas);
    } catch (error) {
      console.error('Error guardando metas:', error);
    }
  };

  // 🔹 Crear meta nueva
  const crearMeta = () => {
    if (!nombreMeta.trim() || !montoMeta) {
      Alert.alert('⚠️ Error', 'Debes ingresar un nombre y un monto meta.');
      return;
    }
    const monto = limpiarNumero(montoMeta);
    if (monto <= 0) {
      Alert.alert('⚠️ Error', 'Ingresa un monto meta válido.');
      return;
    }
    const nueva = {
      id: Date.now(),
      nombre: nombreMeta.trim(),
      meta: monto,
      ahorrado: 0,
      historial: [],
    };
    const nuevasMetas = [...metas, nueva];
    guardarMetas(nuevasMetas);
    setNombreMeta('');
    setMontoMeta('');
  };

  // 🔹 Asignar ahorro pendiente a una meta
  const asignarAhorroMeta = async (ahorro, idMeta) => {
    try {
      const nuevasMetas = metas.map((m) => {
        if (m.id === idMeta) {
          const nuevoHistorial = [...(m.historial || []), ahorro.monto];
          const ahorradoTotal = nuevoHistorial.reduce((acc, v) => acc + v, 0);
          return { ...m, historial: nuevoHistorial, ahorrado: ahorradoTotal };
        }
        return m;
      });

      await guardarMetas(nuevasMetas);

      // Marcar ese ahorro como asignado
      const finanzasGuardadas = await AsyncStorage.getItem(claveFinanzas);
      if (finanzasGuardadas) {
        let fin = JSON.parse(finanzasGuardadas);
        if (Array.isArray(fin)) fin = fin[0] || {};

        const nuevosMovimientos = fin.movimientos.map((mov) =>
          mov.id === ahorro.id ? { ...mov, asignadoMeta: true } : mov
        );
        await AsyncStorage.setItem(claveFinanzas, JSON.stringify({ ...fin, movimientos: nuevosMovimientos }));
      }

      setAhorrosPendientes((prev) => prev.filter((a) => a.id !== ahorro.id));

      Alert.alert('✅ Ahorro asignado', `Se sumaron $${ahorro.monto.toLocaleString('es-CO')} a tu meta.`);
    } catch (error) {
      console.error('Error asignando ahorro:', error);
    }
  };

  // 🔹 Eliminar meta
  const eliminarMeta = (id) => {
    Alert.alert(
      '🗑 Eliminar meta',
      '¿Seguro que deseas eliminar esta meta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const nuevasMetas = metas.filter((m) => m.id !== id);
            await guardarMetas(nuevasMetas);
            Alert.alert('✅ Meta eliminada', 'La meta se ha eliminado correctamente.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>💰 Tus Metas de Ahorro</Text>

      {/* 🔸 Ahorros disponibles para asignar */}
      {ahorrosPendientes.length > 0 && (
        <View style={styles.pendientesBox}>
          <Text style={styles.subtitulo}>🪙 Ahorros sin asignar:</Text>
          {ahorrosPendientes.map((ahorro) => (
            <View key={ahorro.id} style={styles.pendienteItem}>
              <Text style={{ flex: 1 }}>
                💵 ${ahorro.monto.toLocaleString('es-CO')} — {ahorro.descripcion}
              </Text>
              {metas.length > 0 ? (
                <TouchableOpacity
                  style={styles.botonAsignar}
                  onPress={() =>
                    Alert.alert(
                      'Asignar a meta',
                      'Selecciona una meta para este ahorro',
                      metas.map((m) => ({
                        text: m.nombre,
                        onPress: () => asignarAhorroMeta(ahorro, m.id),
                      }))
                    )
                  }
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Asignar</Text>
                </TouchableOpacity>
              ) : (
                <Text style={{ color: '#6B7280' }}>No hay metas creadas</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* 🔸 Crear nuevas metas */}
      <TextInput
        style={styles.input}
        placeholder="Nombre de la meta (ej: Viaje, Laptop...)"
        value={nombreMeta}
        onChangeText={setNombreMeta}
      />
      <TextInput
        style={styles.input}
        placeholder="Monto meta (COP)"
        keyboardType="numeric"
        value={montoMeta}
        onChangeText={setMontoMeta}
      />
      <Button title="Crear meta" color="#2563EB" onPress={crearMeta} />

      {metas.length > 0 ? (
        metas.map((meta) => {
          const ahorrado = Number(meta.ahorrado || 0);
          const faltante = Math.max((meta.meta || 0) - ahorrado, 0);
          const progreso = Math.min((ahorrado / meta.meta) * 100, 100);
          return (
            <View key={meta.id} style={styles.metaCard}>
              <Text style={styles.metaTitulo}>{meta.nombre}</Text>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${progreso}%` }]} />
              </View>
              <Text style={styles.metaSubtitulo}>
                Llevas ${ahorrado.toLocaleString('es-CO')} — te faltan ${faltante.toLocaleString('es-CO')}
              </Text>

              {Array.isArray(meta.historial) && meta.historial.length > 0 && (
                <View style={styles.historial}>
                  <Text style={styles.historialTitulo}>Historial de ahorros:</Text>
                  {meta.historial.map((h, index) => (
                    <Text key={index} style={styles.historialItem}>
                      • ${Number(h).toLocaleString('es-CO')}
                    </Text>
                  ))}
                </View>
              )}

              <View style={{ marginTop: 10 }}>
                <Button title="🗑 Eliminar meta" color="#DC2626" onPress={() => eliminarMeta(meta.id)} />
              </View>
            </View>
          );
        })
      ) : (
        <Text style={{ textAlign: 'center', marginTop: 20, color: '#6B7280' }}>
          Aún no tienes metas de ahorro.
        </Text>
      )}

      <View style={{ marginTop: 30 }}>
        <Button title="🏦 Volver a Finanzas" color="#6B7280" onPress={onVolverFinanzas} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F9FAFB', flexGrow: 1 },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1E3A8A',
    marginBottom: 15,
  },
  subtitulo: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 10 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  pendientesBox: {
    backgroundColor: '#E0F2FE',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  pendienteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  botonAsignar: {
    backgroundColor: '#2563EB',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  metaCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  metaTitulo: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  metaSubtitulo: { marginTop: 5, color: '#374151' },
  progressContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#10B981',
    borderRadius: 10,
  },
  historial: {
    marginTop: 10,
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 8,
  },
  historialTitulo: { fontWeight: 'bold', color: '#1F2937', marginBottom: 5 },
  historialItem: { color: '#374151' },
});
