import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
 
export default function PresupuestScreen({ nombreUsuario, contrasenaUsuario, onVolverInicio }) {
  // Memoiza la clave para evitar re-renders innecesarios
  const claveUsuario = useMemo(() => `finanzas_${nombreUsuario}_${contrasenaUsuario}`, [nombreUsuario, contrasenaUsuario]);
  const screenWidth = Dimensions.get('window').width - 40;
 
  const [sueldo, setSueldo] = useState('');
  const [otrosIngresos, setOtrosIngresos] = useState('');
  const [arriendo, setArriendo] = useState('');
  const [servicios, setServicios] = useState('');
  const [transporte, setTransporte] = useState('');
  const [alimentacion, setAlimentacion] = useState('');
  const [otrosGastos, setOtrosGastos] = useState('');
  const [ingresosExtra, setIngresosExtra] = useState([]);
  const [gastosExtra, setGastosExtra] = useState([]);
  const [nuevoIngreso, setNuevoIngreso] = useState('');
  const [nuevoGasto, setNuevoGasto] = useState('');
  const [saldoFinal, setSaldoFinal] = useState(null);
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);
  const [diasRestantes, setDiasRestantes] = useState('');
  const [presupuestoDiario, setPresupuestoDiario] = useState(null);

  // 🆕 NUEVOS ESTADOS PARA METAS Y BONOS
  const [ahorros, setAhorros] = useState([]); // Ahora con estructura: { nombre, meta, ahorrado, esBono }
  const [nombreMeta, setNombreMeta] = useState('');
  const [metaObjetivo, setMetaObjetivo] = useState('');
  const [abonoInicial, setAbonoInicial] = useState('');
  const [esBono, setEsBono] = useState(false); // Toggle para saber si es bono

  // 🆕 Estado para consejos automáticos
  const [consejos, setConsejos] = useState([]);
  const [mostrarModalDias, setMostrarModalDias] = useState(false);
const [inputDias, setInputDias] = useState('');

  // 🔹 Cargar datos guardados
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const datosGuardados = await AsyncStorage.getItem(claveUsuario);
        if (datosGuardados) {
          const datos = JSON.parse(datosGuardados);
          setSueldo(datos.sueldo || '');
          setOtrosIngresos(datos.otrosIngresos || '');
          setArriendo(datos.arriendo || '');
          setServicios(datos.servicios || '');
          setTransporte(datos.transporte || '');
          setAlimentacion(datos.alimentacion || '');
          setOtrosGastos(datos.otrosGastos || '');
          setIngresosExtra(datos.ingresosExtra || []);
          setGastosExtra(datos.gastosExtra || []);
          setSaldoFinal(datos.saldoFinal || 0);
          setTotalIngresos(datos.totalIngresos || 0);
          setTotalGastos(datos.totalGastos || 0);
          setDiasRestantes(datos.diasRestantes || '');
          setPresupuestoDiario(datos.presupuestoDiario || null);
          setAhorros(datos.ahorros || []);
          setConsejos(datos.consejos || []); // cargar consejos si estaban guardados
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar los datos guardados');
        console.error('Error cargando datos:', error);
      }
    };
    cargarDatos();
  }, [claveUsuario]);

  // 🔹 Guardar datos
  const guardarDatos = async (datos) => {
    try {
      await AsyncStorage.setItem(claveUsuario, JSON.stringify(datos));
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los datos');
      console.error('Error guardando datos:', error);
    }
  };

  // 🔹 Función robusta para limpiar números
  const limpiarNumero = (valor) => {
    if (valor === null || valor === undefined) return 0;
    if (typeof valor === 'number') return valor;
    const limpio = valor.toString().replace(/[.,\s]/g, '');
    return parseFloat(limpio) || 0;
  };

  // 🔹 Calcular finanzas
  const calcularFinanzas = () => {
    const numSueldo = limpiarNumero(sueldo);
    const numOtrosIngresos = limpiarNumero(otrosIngresos);
    const numArriendo = limpiarNumero(arriendo);
    const numServicios = limpiarNumero(servicios);
    const numTransporte = limpiarNumero(transporte);
    const numAlimentacion = limpiarNumero(alimentacion);
    const numOtrosGastos = limpiarNumero(otrosGastos);

    const totalIng =
      numSueldo + numOtrosIngresos + ingresosExtra.reduce((acc, val) => acc + limpiarNumero(val), 0);
    const totalGas =
      numArriendo +
      numServicios +
      numTransporte +
      numAlimentacion +
      numOtrosGastos +
      gastosExtra.reduce((acc, val) => acc + limpiarNumero(val), 0);

    // 🆕 Calcular total ahorrado (solo lo que YA se ahorró)
    const totalAhorrado = ahorros.reduce((acc, meta) => acc + meta.ahorrado, 0);

    const saldo = totalIng - totalGas - totalAhorrado;

    setTotalIngresos(totalIng);
    setTotalGastos(totalGas);
    setSaldoFinal(saldo);

    // 🧠 Generar consejos automáticos basados en proporciones
    const nuevosConsejos = [];
    const porcentajeGasto = (valor) => (totalIng > 0 ? (valor / totalIng) * 100 : 0);

    if (porcentajeGasto(numAlimentacion) > 30) {
      nuevosConsejos.push('🍔 Estás gastando más del 30% de tus ingresos en alimentación — considera planificar comidas y comprar al por mayor.');
    }
    if (porcentajeGasto(numTransporte) > 15) {
      nuevosConsejos.push('🚌 Transporte representa más del 15% de tus ingresos — revisa rutas, combina viajes o usa transporte más económico.');
    }
    if (porcentajeGasto(numServicios) > 20) {
      nuevosConsejos.push('💡 Servicios altos: revisa consumo de energía/agua o compara proveedores para reducir costos.');
    }
    if (porcentajeGasto(numOtrosGastos) > 20) {
      nuevosConsejos.push('🛍️ "Otros" es grande — revisa sus partidas y elimina compras no esenciales.');
    }
    // Si el saldo es muy bajo en relación al ingreso
    if (saldo < totalIng * 0.1) {
      nuevosConsejos.push('⚠️ Tu saldo final es menor al 10% de tus ingresos. Podrías priorizar reducir gastos o aumentar ingresos.');
    }
    // Mensaje positivo si no hay problemas detectados
    if (nuevosConsejos.length === 0) {
      nuevosConsejos.push('✅ ¡Muy bien! Tus gastos están equilibrados respecto a tus ingresos.');
    }

    setConsejos(nuevosConsejos);

    guardarDatos({
      sueldo,
      otrosIngresos,
      arriendo,
      servicios,
      transporte,
      alimentacion,
      otrosGastos,
      ingresosExtra,
      gastosExtra,
      saldoFinal: saldo,
      totalIngresos: totalIng,
      totalGastos: totalGas,
      diasRestantes,
      presupuestoDiario,
      ahorros,
      consejos: nuevosConsejos,
    });
  };

  // 🔹 Calcular presupuesto diario (compatible con Android)
// Función auxiliar para calcular y guardar el presupuesto
const calcularYGuardarPresupuesto = (dias) => {
  const diario = saldoFinal / dias;
  setDiasRestantes(dias);
  setPresupuestoDiario(diario);

  guardarDatos({
    sueldo, otrosIngresos, arriendo, servicios, transporte, alimentacion,
    otrosGastos, ingresosExtra, gastosExtra, saldoFinal, totalIngresos,
    totalGastos, diasRestantes: dias, presupuestoDiario: diario, ahorros, consejos,
  });

  Alert.alert(
    '💡 Presupuesto diario calculado',
    `Te faltan ${dias} días para tu próximo pago.\n\n💰 Puedes gastar hasta $${diario.toLocaleString('es-CO')} por día.\n\n📊 Total disponible: $${saldoFinal.toLocaleString('es-CO')}`,
    [{ text: 'Entendido' }]
  );
};

// Calcular presupuesto diario con modal
const calcularPresupuestoDiario = () => {
  if (saldoFinal === null) {
    Alert.alert('⚠️ Atención', 'Primero debes calcular tus finanzas para obtener tu saldo.');
    return;
  }

  if (Platform.OS === 'ios') {
    Alert.prompt(
      '📆 Días hasta tu próximo pago',
      'Ingresa cuántos días faltan para tu próximo pago:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Calcular',
          onPress: (input) => {
            const dias = parseInt(input);
            if (dias && dias > 0) {
              calcularYGuardarPresupuesto(dias);
            } else {
              Alert.alert('⚠️', 'Por favor ingresa un número válido de días');
            }
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  } else {
    setMostrarModalDias(true);
  }
};

  // 🔹 Reiniciar datos
  const reiniciarFinanzas = async () => {
    Alert.alert('🧹 Reiniciar finanzas', '¿Estás seguro de eliminar todos tus datos?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, borrar todo',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem(claveUsuario);
            setSueldo('');
            setOtrosIngresos('');
            setArriendo('');
            setServicios('');
            setTransporte('');
            setAlimentacion('');
            setOtrosGastos('');
            setIngresosExtra([]);
            setGastosExtra([]);
            setSaldoFinal(null);
            setTotalIngresos(0);
            setTotalGastos(0);
            setDiasRestantes('');
            setPresupuestoDiario(null);
            setAhorros([]);
            setConsejos([]);
            Alert.alert('✅ Listo', 'Todos tus datos han sido eliminados.');
          } catch (error) {
            Alert.alert('Error', 'No se pudieron eliminar los datos');
          }
        },
      },
    ]);
  };

  // 🔹 Agregar ingreso y gasto
  const agregarIngreso = () => {
    if (nuevoIngreso.trim() !== '') {
      const ingresoNumero = limpiarNumero(nuevoIngreso);
      setIngresosExtra([...ingresosExtra, ingresoNumero]);
      setNuevoIngreso('');
    }
  };

  const agregarGasto = () => {
    if (nuevoGasto.trim() !== '') {
      const gastoNumero = limpiarNumero(nuevoGasto);
      setGastosExtra([...gastosExtra, gastoNumero]);
      setNuevoGasto('');
    }
  };

  // 🆕 AGREGAR META DE AHORRO O BONO
  const agregarMeta = () => {
    const meta = limpiarNumero(metaObjetivo);
    const abono = limpiarNumero(abonoInicial);

    if (nombreMeta.trim() === '' || meta <= 0) {
      Alert.alert('⚠️', 'Ingresa un nombre y una meta válida');
      return;
    }

    if (abono > meta) {
      Alert.alert('⚠️', 'El abono inicial no puede ser mayor a la meta');
      return;
    }

    const nuevaMeta = {
      nombre: nombreMeta,
      meta: meta,
      ahorrado: abono,
      esBono: esBono
    };

    const nuevosAhorros = [...ahorros, nuevaMeta];
    setAhorros(nuevosAhorros);
    
    setNombreMeta('');
    setMetaObjetivo('');
    setAbonoInicial('');
    setEsBono(false);

    const totalAhorrado = nuevosAhorros.reduce((acc, m) => acc + m.ahorrado, 0);
    const saldoCalculado = totalIngresos - totalGastos - totalAhorrado;
    setSaldoFinal(saldoCalculado);

    if (diasRestantes) {
      setPresupuestoDiario(saldoCalculado / diasRestantes);
    }

    guardarDatos({
      sueldo,
      otrosIngresos,
      arriendo,
      servicios,
      transporte,
      alimentacion,
      otrosGastos,
      ingresosExtra,
      gastosExtra,
      saldoFinal: saldoCalculado,
      totalIngresos,
      totalGastos,
      diasRestantes,
      presupuestoDiario: diasRestantes ? saldoCalculado / diasRestantes : null,
      ahorros: nuevosAhorros,
      consejos,
    });

    Alert.alert('✅', `${esBono ? 'Bono' : 'Meta de ahorro'} agregada correctamente`);
  };

  // 🆕 ABONAR A UNA META EXISTENTE (Nota: necesitas implementar un modal para input)
  const abonarAMeta = (index) => {
    Alert.alert(
      '💰 Abonar a meta',
      `Función de abono para "${ahorros[index].nombre}". Implementa un modal con TextInput para ingresar el monto.`,
      [{ text: 'OK' }]
    );
  };

  // 🆕 ELIMINAR META
  const eliminarMeta = (index) => {
    Alert.alert('❌ Eliminar meta', '¿Deseas eliminar esta meta de ahorro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          const nuevosAhorros = ahorros.filter((_, i) => i !== index);
          setAhorros(nuevosAhorros);

          const totalAhorrado = nuevosAhorros.reduce((acc, m) => acc + m.ahorrado, 0);
          const saldoCalculado = totalIngresos - totalGastos - totalAhorrado;
          setSaldoFinal(saldoCalculado);

          if (diasRestantes) {
            setPresupuestoDiario(saldoCalculado / diasRestantes);
          }

          guardarDatos({
            sueldo,
            otrosIngresos,
            arriendo,
            servicios,
            transporte,
            alimentacion,
            otrosGastos,
            ingresosExtra,
            gastosExtra,
            saldoFinal: saldoCalculado,
            totalIngresos,
            totalGastos,
            diasRestantes,
            presupuestoDiario: diasRestantes ? saldoCalculado / diasRestantes : null,
            ahorros: nuevosAhorros,
            consejos,
          });
        },
      },
    ]);
  };

  // 🔹 Datos para gráficos
  const dataGastos = [
    { name: 'Arriendo', population: limpiarNumero(arriendo), color: '#2563EB' },
    { name: 'Servicios', population: limpiarNumero(servicios), color: '#10B981' },
    { name: 'Transporte', population: limpiarNumero(transporte), color: '#F59E0B' },
    { name: 'Alimentación', population: limpiarNumero(alimentacion), color: '#EF4444' },
    { name: 'Otros', population: limpiarNumero(otrosGastos), color: '#8B5CF6' },
  ].filter(d => d.population > 0);

  // 🔹 NUEVO GRÁFICO DE BARRAS: Gastos vs Saldo
  const dataBarra = {
    labels: ['Gastos', 'Saldo'],
    datasets: [
      {
        data: [totalGastos || 0, (saldoFinal && saldoFinal > 0) ? saldoFinal : 0],
      },
    ],
  };

  // Escalamos el eje Y al total de ingresos (si está disponible)
  const chartConfigBar = {
    backgroundGradientFrom: '#FFF',
    backgroundGradientTo: '#FFF',
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    barPercentage: 0.6,
    decimalPlaces: 0,
  };

  // 🔹 UI
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>👋 Bienvenido, {nombreUsuario}</Text>
      <Text style={styles.subtitulo}>Administra tus finanzas personales</Text>

      {/* INGRESOS */}
      <Text style={styles.seccion}>💵 Ingresos</Text>
      <TextInput style={styles.input} placeholder="Sueldo mensual" keyboardType="numeric" value={sueldo} onChangeText={setSueldo} />
      <TextInput style={styles.input} placeholder="Otros ingresos" keyboardType="numeric" value={otrosIngresos} onChangeText={setOtrosIngresos} />
      <View style={styles.fila}>
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Agregar otro ingreso" keyboardType="numeric" value={nuevoIngreso} onChangeText={setNuevoIngreso} />
        <Button title="+" onPress={agregarIngreso} />
      </View>

      {/* GASTOS */}
      <Text style={styles.seccion}>💸 Gastos</Text>
      <TextInput style={styles.input} placeholder="Arriendo" keyboardType="numeric" value={arriendo} onChangeText={setArriendo} />
      <TextInput style={styles.input} placeholder="Servicios públicos" keyboardType="numeric" value={servicios} onChangeText={setServicios} />
      <TextInput style={styles.input} placeholder="Transporte" keyboardType="numeric" value={transporte} onChangeText={setTransporte} />
      <TextInput style={styles.input} placeholder="Alimentación" keyboardType="numeric" value={alimentacion} onChangeText={setAlimentacion} />
      <TextInput style={styles.input} placeholder="Otros gastos" keyboardType="numeric" value={otrosGastos} onChangeText={setOtrosGastos} />
      <View style={styles.fila}>
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Agregar otro gasto" keyboardType="numeric" value={nuevoGasto} onChangeText={setNuevoGasto} />
        <Button title="+" color="#DC2626" onPress={agregarGasto} />
      </View>

      {/* 🆕 METAS DE AHORRO Y BONOS */}
      <Text style={styles.seccion}>💰 Metas de Ahorro y Bonos</Text>
      <View style={styles.metaContainer}>
        <TextInput 
          style={styles.input} 
          placeholder="Nombre (ej: Viaje a Cartagena)" 
          value={nombreMeta} 
          onChangeText={setNombreMeta} 
        />
        <View style={styles.fila}>
          <TextInput 
            style={[styles.input, { flex: 1 }]} 
            placeholder="Meta total" 
            keyboardType="numeric" 
            value={metaObjetivo} 
            onChangeText={setMetaObjetivo} 
          />
          <TextInput 
            style={[styles.input, { flex: 1 }]} 
            placeholder="Abono inicial" 
            keyboardType="numeric" 
            value={abonoInicial} 
            onChangeText={setAbonoInicial} 
          />
        </View>
        <TouchableOpacity 
          style={[styles.toggleBono, esBono && styles.toggleBonoActivo]}
          onPress={() => setEsBono(!esBono)}
        >
          <Text style={styles.toggleTexto}>
            {esBono ? '🎁 Es un BONO' : '💼 Es Meta de Ahorro'}
          </Text>
        </TouchableOpacity>
        <Button title="➕ Agregar Meta" color="#10B981" onPress={agregarMeta} />
      </View>

      {/* LISTA DE METAS */}
      {ahorros.length > 0 && (
        <View style={styles.listaMetas}>
          {ahorros.map((meta, idx) => {
            const falta = meta.meta - meta.ahorrado;
            const progreso = (meta.ahorrado / meta.meta) * 100;
            
            return (
              <View key={idx} style={styles.metaCard}>
                <View style={styles.metaHeader}>
                  <Text style={styles.metaNombre}>
                    {meta.esBono ? '🎁' : '💼'} {meta.nombre}
                  </Text>
                  {meta.esBono && <View style={styles.badgeBono}><Text style={styles.badgeTexto}>BONO</Text></View>}
                </View>
                
                <View style={styles.progresoContainer}>
                  <View style={[styles.progresoBar, { width: `${progreso}%` }]} />
                </View>
                
                <View style={styles.metaInfo}>
                  <Text style={styles.metaTexto}>
                    Meta: ${meta.meta.toLocaleString('es-CO')}
                  </Text>
                  <Text style={styles.metaTexto}>
                    Ahorrado: ${meta.ahorrado.toLocaleString('es-CO')}
                  </Text>
                  <Text style={[styles.metaFalta, falta === 0 && styles.metaCompleta]}>
                    {falta === 0 ? '✅ ¡Meta completada!' : `Faltan: $${falta.toLocaleString('es-CO')}`}
                  </Text>
                </View>

                <View style={styles.metaBotones}>
                  <TouchableOpacity 
                    style={styles.botonAbonar}
                    onPress={() => abonarAMeta(idx)}
                  >
                    <Text style={styles.botonTexto}>💰 Abonar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.botonEliminar}
                    onPress={() => eliminarMeta(idx)}
                  >
                    <Text style={styles.botonTexto}>❌ Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* BOTONES */}
      <View style={styles.botonContainer}>
        <Button title="Calcular finanzas" color="#2563EB" onPress={calcularFinanzas} />
      </View>
      <View style={styles.botonContainer}>
        <Button title="📆 Calcular presupuesto diario" color="#10B981" onPress={calcularPresupuestoDiario} />
      </View>

      {/* RESULTADOS */}
      {saldoFinal !== null && (
        <View style={styles.resultados}>
          <Text style={styles.resultadoTexto}>💰 Total ingresos: ${totalIngresos.toLocaleString('es-CO')}</Text>
          <Text style={styles.resultadoTexto}>💸 Total gastos: ${totalGastos.toLocaleString('es-CO')}</Text>
          <Text style={styles.resultadoTexto}>
            💼 Total ahorrado: ${ahorros.reduce((acc, m) => acc + m.ahorrado, 0).toLocaleString('es-CO')}
          </Text>
          <Text style={[styles.resultadoTexto, { color: saldoFinal >= 0 ? 'green' : 'red', fontWeight: 'bold' }]}>
            🧾 Saldo disponible: ${saldoFinal.toLocaleString('es-CO')}
          </Text>
        </View>
      )}

      {/* 📆 PRESUPUESTO DIARIO */}
      {presupuestoDiario !== null && (
        <View style={styles.presupuestoContainer}>
          <Text style={styles.seccion}>📆 Presupuesto diario</Text>
          <Text style={styles.resultadoTexto}>Días restantes: {diasRestantes}</Text>
          <Text style={[styles.resultadoTexto, { color: '#2563EB', fontWeight: 'bold' }]}>
            Puedes gastar hasta: ${presupuestoDiario.toLocaleString('es-CO')} por día
          </Text>
        </View>
      )}

      {/* GRÁFICO DE GASTOS */}
      {totalGastos > 0 && dataGastos.length > 0 && (
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <Text style={styles.seccion}>📈 Distribución de tus gastos</Text>
          <PieChart
            data={dataGastos}
            width={screenWidth}
            height={250}
            chartConfig={{
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="10"
            hasLegend={true}
          />
        </View>
      )}

      {/* 🔹 NUEVO: GRÁFICO DE BARRAS Gastos vs Saldo */}
      {totalIngresos > 0 && (
        <View style={{ marginTop: 30, alignItems: 'center' }}>
          <Text style={styles.seccion}>📊 Gastos vs Saldo</Text>
          <BarChart
            data={dataBarra}
            width={screenWidth}
            height={250}
            yAxisLabel="$"
            chartConfig={chartConfigBar}
            fromZero
            showValuesOnTopOfBars
            yAxisInterval={1}
            // yAxisMax usado para escalar al total de ingresos si está definido
            // (algunas versiones de react-native-chart-kit soportan yAxisMax)
            yAxisMax={totalIngresos > 0 ? totalIngresos : undefined}
            style={{ borderRadius: 12 }}
          />
          <Text style={{ marginTop: 8, color: '#6B7280' }}>
            Eje Y basado en tus ingresos totales: ${totalIngresos.toLocaleString('es-CO')}
          </Text>
        </View>
      )}

      {/* HISTORIAL */}
      <View style={styles.historialContainer}>
        <Text style={styles.seccion}>📜 Historial de movimientos</Text>
        {ingresosExtra.length > 0 && (
          <>
            <Text style={styles.subtituloHistorial}>Ingresos adicionales:</Text>
            {ingresosExtra.map((ing, idx) => (
              <Text key={idx} style={{ color: 'green' }}>+ ${ing.toLocaleString('es-CO')}</Text>
            ))}
          </>
        )}
        {gastosExtra.length > 0 && (
          <>
            <Text style={styles.subtituloHistorial}>Gastos adicionales:</Text>
            {gastosExtra.map((gas, idx) => (
              <Text key={idx} style={{ color: 'red' }}>- ${gas.toLocaleString('es-CO')}</Text>
            ))}
          </>
        )}
      </View>

      {/* 🤖 CONSEJOS AUTOMÁTICOS */}
      {consejos.length > 0 && (
        <View style={{ marginTop: 20, backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8 }}>
          <Text style={[styles.seccion, { marginBottom: 6 }]}>💡 Consejos automáticos</Text>
          {consejos.map((c, i) => (
            <Text key={i} style={{ marginBottom: 6, color: '#92400E' }}>• {c}</Text>
          ))}
        </View>
      )}

      {/* BOTONES FINALES */}
      <View style={styles.botonContainer}>
        <Button title="🔄 Reiniciar todo" color="#EF4444" onPress={reiniciarFinanzas} />
      </View>
      <View style={styles.botonContainer}>
        <Button title="🏠 Volver al inicio" color="#6B7280" onPress={onVolverInicio} />
      </View>

      {/* MODAL PARA INGRESAR DÍAS */}
      <Modal visible={mostrarModalDias} transparent={true} animationType="slide" onRequestClose={() => setMostrarModalDias(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>📆 Días hasta tu próximo pago</Text>
            <Text style={styles.modalSubtitulo}>Ingresa cuántos días faltan para tu próximo pago:</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: 15, 30, 7..."
              keyboardType="numeric"
              value={inputDias}
              onChangeText={setInputDias}
              autoFocus={true}
            />
            
            <View style={styles.modalBotones}>
              <TouchableOpacity
                style={[styles.modalBoton, styles.modalBotonCancelar]}
                onPress={() => {
                  setMostrarModalDias(false);
                  setInputDias('');
                }}
              >
                <Text style={styles.modalBotonTexto}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalBoton, styles.modalBotonConfirmar]}
                onPress={() => {
                  const dias = parseInt(inputDias);
                  if (dias && dias > 0) {
                    calcularYGuardarPresupuesto(dias);
                    setMostrarModalDias(false);
                    setInputDias('');
                  } else {
                    Alert.alert('⚠️', 'Por favor ingresa un número válido de días');
                  }
                }}
              >
                <Text style={[styles.modalBotonTexto, { color: '#FFF' }]}>Calcular</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  subtitulo: { fontSize: 16, textAlign: 'center', marginBottom: 20, color: '#6B7280' },
  seccion: { fontSize: 18, fontWeight: 'bold', color: '#1E3A8A', marginTop: 20, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#9CA3AF', borderRadius: 8, padding: 10, marginVertical: 5, backgroundColor: '#FFF' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 5 },
  botonContainer: { marginTop: 10 },
  resultados: { marginTop: 20, backgroundColor: '#F0F9FF', padding: 15, borderRadius: 10 },
  resultadoTexto: { fontSize: 16, marginVertical: 3 },
  historialContainer: { marginTop: 30 },
  subtituloHistorial: { fontSize: 16, fontWeight: '600', marginTop: 10, color: '#374151' },
  presupuestoContainer: { marginTop: 20, padding: 15, borderRadius: 10, backgroundColor: '#F0F9FF' },
  
  metaContainer: { 
    backgroundColor: '#F9FAFB', 
    padding: 15, 
    borderRadius: 10, 
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  toggleBono: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
    alignItems: 'center'
  },
  toggleBonoActivo: {
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
    borderColor: '#2563EB'
  },
  toggleTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  listaMetas: {
    marginTop: 15
  },
  metaCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  metaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  metaNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1
  },
  badgeBono: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563EB'
  },
  progresoContainer: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10
  },
  progresoBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 6
  },
  metaInfo: {
    marginBottom: 12
  },
  metaTexto: {
    fontSize: 14,
    color: '#374151',
    marginVertical: 2
  },
  metaFalta: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 4
  },
  metaCompleta: {
    color: '#10B981'
  },
  metaBotones: {
    flexDirection: 'row',
    gap: 10
  },
  botonAbonar: {
    flex: 1,
    backgroundColor: '#10B981',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  botonEliminar: {
    flex: 1,
    backgroundColor: '#EF4444',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
 botonTexto: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14
  },
  
  // Estilos del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12
  },
  modalSubtitulo: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20
  },
  modalInput: {
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    textAlign: 'center'
  },
  modalBotones: {
    flexDirection: 'row',
    gap: 12
  },
  modalBoton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  modalBotonCancelar: {
    backgroundColor: '#E5E7EB'
  },
  modalBotonConfirmar: {
    backgroundColor: '#2563EB'
  },
  modalBotonTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151'
  }
});