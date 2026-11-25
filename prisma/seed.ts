import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando carga de datos de demostración (Municipio Ayacucho)...')

  const tasaCambio = Number(process.env.TASA_CAMBIO_USD_BS || '58.50')
  const montoUsd = 3.0

  // 1. Configuración institucional
  const configs = [
    {
      clave: 'tasa_cambio_usd_bs',
      valor: tasaCambio.toFixed(2),
      descripcion: 'Tasa oficial referencial BCV (Bs. por 1 USD)'
    },
    {
      clave: 'monto_mensual_usd',
      valor: montoUsd.toFixed(2),
      descripcion: 'Tarifa mensual del servicio de recolección por jefe de familia (USD)'
    },
    {
      clave: 'nombre_institucion',
      valor: 'Instituto Municipal de Gestión Ambiental — Ayacucho',
      descripcion: 'Nombre oficial mostrado en encabezado y comprobantes'
    }
  ]

  for (const cfg of configs) {
    await prisma.configuracion.upsert({
      where: { clave: cfg.clave },
      update: {},
      create: cfg
    })
  }

  // 2. Sectores reales de San Juan de Colón, Municipio Ayacucho (Táchira)
  const sectoresData = [
    {
      nombre: 'Centro — Plaza Bolívar',
      descripcion: 'Casco central comercial y residencial de San Juan de Colón',
      latitud: 8.0314,
      longitud: -72.2606,
      horarioEstimado: 'Lunes y Jueves · 7:00 AM – 10:30 AM'
    },
    {
      nombre: 'La Popa',
      descripcion: 'Zona residencial norte de alta densidad',
      latitud: 8.0378,
      longitud: -72.2562,
      horarioEstimado: 'Martes y Viernes · 7:30 AM – 11:00 AM'
    },
    {
      nombre: 'San Félix',
      descripcion: 'Parroquia San Félix y urbanizaciones adyacentes',
      latitud: 8.0235,
      longitud: -72.2684,
      horarioEstimado: 'Miércoles y Sábado · 8:00 AM – 12:00 PM'
    },
    {
      nombre: 'El Topón',
      descripcion: 'Sector residencial oeste y vía principal',
      latitud: 8.0292,
      longitud: -72.2725,
      horarioEstimado: 'Lunes y Jueves · 1:00 PM – 4:30 PM'
    },
    {
      nombre: 'Las Flores',
      descripcion: 'Comunidad residencial sur y avenida perimetral',
      latitud: 8.0204,
      longitud: -72.2548,
      horarioEstimado: 'Martes y Viernes · 1:30 PM – 5:00 PM'
    }
  ]

  const sectores = []
  for (const s of sectoresData) {
    const sector = await prisma.sector.upsert({
      where: { nombre: s.nombre },
      update: s,
      create: s
    })
    sectores.push(sector)
  }

  // 3. Contraseñas demo
  const passVecino = await bcrypt.hash('Vecino123*', 10)
  const passAdmin = await bcrypt.hash('Admin123*', 10)
  const passSupervisor = await bcrypt.hash('Super123*', 10)

  // 4. Administradores y Supervisor
  const admin = await prisma.usuario.upsert({
    where: { correo: 'admin@ayacucho.gob.ve' },
    update: {},
    create: {
      nombre: 'Lcdo. Carlos Méndez',
      cedula: 'V-14520890',
      correo: 'admin@ayacucho.gob.ve',
      telefono: '0414-7120001',
      passwordHash: passAdmin,
      rol: 'admin',
      estado: 'activo',
      ultimoAcceso: new Date()
    }
  })

  await prisma.usuario.upsert({
    where: { correo: 'recaudacion@ayacucho.gob.ve' },
    update: {},
    create: {
      nombre: 'Ing. María Fernanda Rojas',
      cedula: 'V-17842110',
      correo: 'recaudacion@ayacucho.gob.ve',
      telefono: '0424-7154321',
      passwordHash: passAdmin,
      rol: 'admin',
      estado: 'activo',
      ultimoAcceso: new Date(Date.now() - 86400000 * 2)
    }
  })

  await prisma.usuario.upsert({
    where: { correo: 'supervisor@ayacucho.gob.ve' },
    update: {},
    create: {
      nombre: 'Abg. Roberto Zambrano',
      cedula: 'V-12340555',
      correo: 'supervisor@ayacucho.gob.ve',
      telefono: '0416-7198800',
      passwordHash: passSupervisor,
      rol: 'supervisor',
      estado: 'activo',
      ultimoAcceso: new Date(Date.now() - 3600000 * 5)
    }
  })

  // 5. 20 Hogares de prueba (el primero es el usuario demo principal)
  const vecinosDemo = [
    { nombre: 'José Gregorio Pérez', cedula: 'V-18456123', correo: 'vecino@ayacucho.gob.ve', tel: '0414-7123456', casa: 'C-14', dir: 'Carrera 4 con Calle 5', sectorIdx: 0, estadoMesActual: 'pendiente' },
    { nombre: 'Ana María Chacón', cedula: 'V-16234890', correo: 'ana.chacon@correo.ve', tel: '0424-7234567', casa: 'C-22', dir: 'Calle 3, Edif. Bolívar', sectorIdx: 0, estadoMesActual: 'pagado' },
    { nombre: 'Luis Eduardo Ramírez', cedula: 'V-15987321', correo: 'luis.ramirez@correo.ve', tel: '0416-7345678', casa: 'M-08', dir: 'Av. Principal La Popa', sectorIdx: 1, estadoMesActual: 'pagado' },
    { nombre: 'Carmen Teresa Molina', cedula: 'V-13765432', correo: 'carmen.molina@correo.ve', tel: '0414-7456789', casa: 'B-11', dir: 'Vereda 2, La Popa Alta', sectorIdx: 1, estadoMesActual: 'vencido' },
    { nombre: 'Pedro Antonio Sánchez', cedula: 'V-19123456', correo: 'pedro.sanchez@correo.ve', tel: '0424-7567890', casa: 'S-04', dir: 'Calle San Félix Norte', sectorIdx: 2, estadoMesActual: 'pagado' },
    { nombre: 'Yolanda Contreras', cedula: 'V-14876543', correo: 'yolanda.c@correo.ve', tel: '0412-7678901', casa: 'S-19', dir: 'Transversal 4, San Félix', sectorIdx: 2, estadoMesActual: 'pendiente' },
    { nombre: 'Miguel Ángel Guerrero', cedula: 'V-20345678', correo: 'miguel.guerrero@correo.ve', tel: '0414-7789012', casa: 'T-07', dir: 'Vía Principal El Topón', sectorIdx: 3, estadoMesActual: 'pagado' },
    { nombre: 'Rosa Elena Useche', cedula: 'V-11987654', correo: 'rosa.useche@correo.ve', tel: '0426-7890123', casa: 'T-15', dir: 'Callejón Los Pinos, El Topón', sectorIdx: 3, estadoMesActual: 'vencido' },
    { nombre: 'Franklin Javier Pernía', cedula: 'V-21456789', correo: 'franklin.pernia@correo.ve', tel: '0424-7901234', casa: 'F-03', dir: 'Av. Perimetral Las Flores', sectorIdx: 4, estadoMesActual: 'pagado' },
    { nombre: 'Marisol Duque', cedula: 'V-17654321', correo: 'marisol.duque@correo.ve', tel: '0414-7012345', casa: 'F-28', dir: 'Calle 2, Las Flores', sectorIdx: 4, estadoMesActual: 'pendiente' },
    { nombre: 'Héctor Julio Vivas', cedula: 'V-15234987', correo: 'hector.vivas@correo.ve', tel: '0416-7112233', casa: 'C-31', dir: 'Carrera 6 con Calle 2', sectorIdx: 0, estadoMesActual: 'pagado' },
    { nombre: 'Gladys Sofía Becerra', cedula: 'V-12876123', correo: 'gladys.becerra@correo.ve', tel: '0414-7223344', casa: 'C-09', dir: 'Calle 7 frente al Mercado', sectorIdx: 0, estadoMesActual: 'pagado' },
    { nombre: 'Rafael Ernesto Osorio', cedula: 'V-19876234', correo: 'rafael.osorio@correo.ve', tel: '0424-7334455', casa: 'M-17', dir: 'Calle Sucre, La Popa', sectorIdx: 1, estadoMesActual: 'pagado' },
    { nombre: 'Nubia Esperanza Mora', cedula: 'V-16543987', correo: 'nubia.mora@correo.ve', tel: '0412-7445566', casa: 'M-25', dir: 'Sector Mirador La Popa', sectorIdx: 1, estadoMesActual: 'pendiente' },
    { nombre: 'Óscar David Alarcón', cedula: 'V-22345111', correo: 'oscar.alarcon@correo.ve', tel: '0414-7556677', casa: 'S-12', dir: 'Av. Bolívar, San Félix', sectorIdx: 2, estadoMesActual: 'pagado' },
    { nombre: 'Belkis Coromoto Castro', cedula: 'V-14123999', correo: 'belkis.castro@correo.ve', tel: '0424-7667788', casa: 'S-30', dir: 'Calle 5, San Félix Sur', sectorIdx: 2, estadoMesActual: 'vencido' },
    { nombre: 'Wilmer Alexis Paredes', cedula: 'V-18901234', correo: 'wilmer.paredes@correo.ve', tel: '0416-7778899', casa: 'T-21', dir: 'Urb. El Topón Etapa II', sectorIdx: 3, estadoMesActual: 'pagado' },
    { nombre: 'Doris Marina Delgado', cedula: 'V-13456780', correo: 'doris.delgado@correo.ve', tel: '0414-7889900', casa: 'T-02', dir: 'Entrada El Topón', sectorIdx: 3, estadoMesActual: 'pagado' },
    { nombre: 'Alejandro José Niño', cedula: 'V-23456789', correo: 'alejandro.nino@correo.ve', tel: '0424-7990011', casa: 'F-16', dir: 'Calle Las Acacias, Las Flores', sectorIdx: 4, estadoMesActual: 'pagado' },
    { nombre: 'Patricia Isabel Galviz', cedula: 'V-17111222', correo: 'patricia.galviz@correo.ve', tel: '0412-7001122', casa: 'F-40', dir: 'Final Calle 4, Las Flores', sectorIdx: 4, estadoMesActual: 'pendiente' }
  ]

  const ahora = new Date()
  const anioActual = ahora.getFullYear()
  const mesActual = ahora.getMonth() + 1 // 1..12

  const usuariosCreados = []

  for (let i = 0; i < vecinosDemo.length; i++) {
    const v = vecinosDemo[i]
    const sector = sectores[v.sectorIdx]
    const numeroCuenta = `AYA-${String(1001 + i).padStart(5, '0')}`

    const usuario = await prisma.usuario.upsert({
      where: { correo: v.correo },
      update: {},
      create: {
        nombre: v.nombre,
        cedula: v.cedula,
        correo: v.correo,
        telefono: v.tel,
        passwordHash: passVecino,
        rol: 'usuario',
        estado: 'activo',
        ultimoAcceso: new Date(Date.now() - 3600000 * (i + 1))
      }
    })
    usuariosCreados.push(usuario)

    const hogar = await prisma.hogar.upsert({
      where: { usuarioId: usuario.id },
      update: {},
      create: {
        usuarioId: usuario.id,
        sectorId: sector.id,
        numeroCasa: v.casa,
        direccion: v.dir,
        numeroCuenta,
        estado: 'activo'
      }
    })

    // Generar últimos 6 meses de pagos (para gráficos del dashboard e historial)
    for (let offset = 5; offset >= 0; offset--) {
      const d = new Date(anioActual, mesActual - 1 - offset, 1)
      const anio = d.getFullYear()
      const mes = d.getMonth() + 1
      const fechaVenc = new Date(anio, mes - 1, 28)

      let estadoPago = 'pagado'
      if (offset === 0) {
        estadoPago = v.estadoMesActual
      } else if (offset === 1 && v.estadoMesActual === 'vencido') {
        estadoPago = 'vencido'
      } else if (offset === 1 && i % 7 === 0) {
        estadoPago = 'vencido'
      }

      const tasaMes = Number((tasaCambio - offset * 1.15).toFixed(2))
      const montoBs = Number((montoUsd * tasaMes).toFixed(2))
      const fechaPago =
        estadoPago === 'pagado' ? new Date(anio, mes - 1, Math.min(25, 4 + ((i * 3) % 18))) : null
      const ref =
        estadoPago === 'pagado'
          ? `UBII-${anio}${String(mes).padStart(2, '0')}-${String(100000 + i * 317 + offset * 43).slice(0, 6)}`
          : null

      await prisma.pago.upsert({
        where: {
          hogarId_anio_mes: {
            hogarId: hogar.id,
            anio,
            mes
          }
        },
        update: {},
        create: {
          hogarId: hogar.id,
          anio,
          mes,
          montoUsd,
          montoBs,
          tasaCambio: tasaMes,
          fechaPago,
          fechaVenc,
          metodo: i % 4 === 0 ? 'Ubii Pagos (Pago Móvil)' : 'Ubii Pagos (Débito)',
          referencia: ref,
          estado: estadoPago,
          esSimulado: true
        }
      })
    }
  }

  // 6. Las 3 unidades de recolección con ubicaciones iniciales en San Juan de Colón
  const unidadesData = [
    {
      identificador: 'Unidad 1',
      placa: 'A45BC8D',
      chofer: 'José Luis Zambrano',
      estado: 'en_ruta',
      sectoresAsignados: 'Centro — Plaza Bolívar, El Topón',
      horarioEstimado: 'Lun/Jue · 7:00 AM – 4:30 PM',
      latitudActual: 8.0318,
      longitudActual: -72.2612
    },
    {
      identificador: 'Unidad 2',
      placa: 'A72EF1K',
      chofer: 'Ramón Alberto Díaz',
      estado: 'en_ruta',
      sectoresAsignados: 'La Popa, Las Flores',
      horarioEstimado: 'Mar/Vie · 7:30 AM – 5:00 PM',
      latitudActual: 8.0369,
      longitudActual: -72.2571
    },
    {
      identificador: 'Unidad 3',
      placa: 'A91GH3M',
      chofer: 'Efraín Morales',
      estado: 'detenida',
      sectoresAsignados: 'San Félix',
      horarioEstimado: 'Mié/Sáb · 8:00 AM – 12:00 PM',
      latitudActual: 8.0241,
      longitudActual: -72.2678
    }
  ]

  for (const u of unidadesData) {
    const unidad = await prisma.unidad.upsert({
      where: { identificador: u.identificador },
      update: {},
      create: u
    })

    const existingLocs = await prisma.ubicacion.count({ where: { unidadId: unidad.id } })
    if (existingLocs === 0) {
      await prisma.ubicacion.createMany({
        data: [
          {
            unidadId: unidad.id,
            latitud: u.latitudActual - 0.0022,
            longitud: u.longitudActual - 0.0018,
            sectorNombre: u.sectoresAsignados.split(',')[0].trim(),
            timestamp: new Date(Date.now() - 3600000 * 2)
          },
          {
            unidadId: unidad.id,
            latitud: u.latitudActual - 0.0011,
            longitud: u.longitudActual - 0.0009,
            sectorNombre: u.sectoresAsignados.split(',')[0].trim(),
            timestamp: new Date(Date.now() - 3600000)
          },
          {
            unidadId: unidad.id,
            latitud: u.latitudActual,
            longitud: u.longitudActual,
            sectorNombre: u.sectoresAsignados.split(',')[0].trim(),
            timestamp: new Date()
          }
        ]
      })
    }
  }

  // 7. Reportes / Denuncias y Sugerencias de ejemplo
  const countReportes = await prisma.reporte.count()
  if (countReportes === 0) {
    const r1 = await prisma.reporte.create({
      data: {
        usuarioId: usuariosCreados[0].id,
        sectorNombre: 'Centro — Plaza Bolívar',
        categoria: 'Recolección no realizada',
        descripcion:
          'El camión no pasó por la Carrera 4 entre Calles 5 y 6 en el turno de la mañana. Hay bolsas acumuladas en la esquina.',
        ubicacion: 'Carrera 4 con Calle 5, San Juan de Colón',
        latitud: 8.0315,
        longitud: -72.2602,
        estado: 'en_proceso'
      }
    })

    await prisma.respuestaReporte.create({
      data: {
        reporteId: r1.id,
        administradorId: admin.id,
        mensaje:
          'Recibido, vecino. La Unidad 1 tuvo un retraso por tráfico en el mercado municipal y cubrirá la Carrera 4 hoy a las 2:30 PM.'
      }
    })

    const r2 = await prisma.reporte.create({
      data: {
        usuarioId: usuariosCreados[3].id,
        sectorNombre: 'La Popa',
        categoria: 'Sugerencia',
        descripcion:
          'Sería ideal habilitar un punto de reciclaje de plástico y cartón cerca de la cancha de La Popa los fines de semana.',
        ubicacion: 'Cancha Deportiva La Popa',
        latitud: 8.0372,
        longitud: -72.2568,
        estado: 'resuelto'
      }
    })

    await prisma.respuestaReporte.create({
      data: {
        reporteId: r2.id,
        administradorId: admin.id,
        mensaje:
          '¡Excelente propuesta! La incluimos en la jornada piloto de reciclaje comunitario del próximo mes.'
      }
    })

    await prisma.reporte.create({
      data: {
        usuarioId: usuariosCreados[5].id,
        sectorNombre: 'San Félix',
        categoria: 'Unidad dañada',
        descripcion:
          'La Unidad 3 se encuentra detenida cerca de la entrada de San Félix presentando falla mecánica aparente.',
        ubicacion: 'Av. Principal San Félix, parada norte',
        latitud: 8.0241,
        longitud: -72.2678,
        estado: 'recibido'
      }
    })

    await prisma.reporte.create({
      data: {
        usuarioId: usuariosCreados[7].id,
        sectorNombre: 'El Topón',
        categoria: 'Recolección no realizada',
        descripcion: 'En el Callejón Los Pinos se quedaron sin recoger dos contenedores.',
        ubicacion: 'Callejón Los Pinos, El Topón',
        latitud: 8.0294,
        longitud: -72.2721,
        estado: 'recibido'
      }
    })
  }

  // 8. Aviso y Notificaciones iniciales
  const countAvisos = await prisma.aviso.count()
  if (countAvisos === 0) {
    await prisma.aviso.create({
      data: {
        asunto: 'Recordatorio de pago mensual — Servicio de Recolección',
        mensaje:
          'Estimado(a) vecino(a), le recordamos que su tarifa mensual de $3.00 USD del servicio de recolección de desechos sólidos se encuentra disponible para pago rápido vía Ubii Pagos.',
        tipoDestinatario: 'pendientes',
        totalDestinatarios: 7,
        destinatariosJson: JSON.stringify(usuariosCreados.slice(0, 7).map((u) => u.id)),
        estado: 'enviado',
        creadoPorId: admin.id
      }
    })

    await prisma.notificacion.createMany({
      data: [
        {
          usuarioId: usuariosCreados[0].id,
          titulo: 'Recordatorio de pago del mes en curso',
          mensaje:
            'Tu tarifa mensual de $3.00 USD está pendiente. Puedes pagarla en segundos desde el portal con Ubii Pagos.',
          tipo: 'aviso',
          enlace: '/usuario/pagos'
        },
        {
          usuarioId: usuariosCreados[0].id,
          titulo: 'Actualización en tu reporte',
          mensaje:
            'Tu reporte "Recolección no realizada" cambió a estado En proceso y recibió respuesta del administrador.',
          tipo: 'reporte',
          enlace: '/usuario/reportes'
        }
      ]
    })
  }

  // 9. Auditoría inicial
  const countAudit = await prisma.auditoria.count()
  if (countAudit === 0) {
    await prisma.auditoria.create({
      data: {
        administradorId: admin.id,
        accion: 'INICIALIZACION_SISTEMA',
        entidad: 'Configuracion',
        entidadId: 'tasa_cambio_usd_bs',
        detalle: `Tasa inicial configurada en ${tasaCambio.toFixed(2)} Bs/USD`
      }
    })
  }

  console.log('Seed completado exitosamente.')
  console.log('Cuentas de demostración:')
  console.log('  Vecino:     vecino@ayacucho.gob.ve / Vecino123*')
  console.log('  Admin:      admin@ayacucho.gob.ve / Admin123*')
  console.log('  Supervisor: supervisor@ayacucho.gob.ve / Super123*')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
