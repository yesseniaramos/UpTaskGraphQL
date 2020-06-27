const Usuario = require("../models/Usuario");
const Proyecto = require("../models/Proyecto");
const Tarea = require("../models/Tarea");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "variables.env" });
// Crear y firmar un JWT
const crearToken = (usuario, secreta, expiresIn) => {
  const { id, email, nombre } = usuario;
  return jwt.sign({ id, email, nombre }, secreta, { expiresIn });
};

const resolvers = {
  Query: {
    obtenerProyectos: async (_, {}, context) => {
      const proyectos = await Proyecto.find({ creador: context.usuario.id });
      return proyectos;
    },
    obtenerTareas: async (_, { input }, context) => {
      const tareas = await Tarea.find({ creador: context.usuario.id })
        .where("proyecto")
        .equals(input.proyecto);

      return tareas;
    },
  },
  Mutation: {
    crearUsuario: async (_, { input }, context, info) => {
      const { email, password } = input;
      const existeUsuario = await Usuario.findOne({ email });

      // Si el usuario existe
      if (existeUsuario) {
        throw new Error("El usuario ya está registrado");
      }

      try {
        // Encryptar password
        const salt = await bcryptjs.genSalt(10);
        input.password = await bcryptjs.hash(password, salt);
        console.log(input);

        // Registrar nuevo usuario
        const nuevoUsuario = new Usuario(input);
        console.log(nuevoUsuario);
        nuevoUsuario.save();
        return "Usuario Creado Correctamente";
      } catch (error) {
        console.log(error);
      }
    },
    autenticarUsuario: async (_, { input }) => {
      // Si el usuario existe
      const { email, password } = input;
      const existeUsuario = await Usuario.findOne({ email });

      // Si el usuario existe
      if (!existeUsuario) {
        throw new Error("El usuario no existe");
      }

      // Si el password es correcto

      const passwordCorrecto = await bcryptjs.compare(
        password,
        existeUsuario.password
      );

      if (!passwordCorrecto) {
        throw new Error("Password Inccorrecto");
      }

      // Dar acceso a la app

      return {
        token: crearToken(existeUsuario, process.env.SECRETA, "2hr"),
      };
    },
    nuevoProyecto: async (_, { input }, context) => {
      try {
        const proyecto = new Proyecto(input);

        console.log("proyecto", context);

        // Asociar el creador
        proyecto.creador = context.usuario.id;

        // alamacenarlo en la base de datos
        const resultado = await proyecto.save();

        return resultado;
      } catch (error) {
        console.log(error);
      }
    },
    actualizarProyecto: async (_, { id, input }, context) => {
      // Revisar si el proyecto existe o no
      let proyecto = await Proyecto.findById(id);

      if (!proyecto) {
        throw new Error("Proyecto no encontrado");
      }
      // Revisar que si la persona que trata de editarlo, es el creador
      if (proyecto.creador.toString() !== context.usuario.id) {
        throw new Error("Sin suficientes permisos");
      }

      // Guardar el proyecto
      proyecto = await Proyecto.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
      return proyecto;
    },
    eliminarProyecto: async (_, { id, input }, context) => {
      // Revisar si el proyecto existe o no
      let proyecto = await Proyecto.findById(id);

      if (!proyecto) {
        throw new Error("Proyecto no encontrado");
      }
      // Revisar que si la persona que trata de editarlo, es el creador
      if (proyecto.creador.toString() !== context.usuario.id) {
        throw new Error("Sin suficientes permisos");
      }

      // Eliminar
      await Proyecto.findOneAndDelete({ _id: id });
      return "Proyecto Eliminando";
    },
    nuevaTarea: async (_, { input }, context) => {
      try {
        const tarea = new Tarea(input);

        console.log("tarea", context);

        // Asociar el creador
        tarea.creador = context.usuario.id;

        // alamacenarlo en la base de datos
        const resultado = await tarea.save();

        return resultado;
      } catch (error) {
        console.log(error);
      }
    },
    actualizarTarea: async (_, { id, input, estado }, context) => {
      // Si la tarea existe o no
      let tarea = await Tarea.findById(id);

      if (!tarea) {
        throw new Error("Tarea no encontrada");
      }

      // Si la persona que edita es el creador

      if (tarea.creador.toString() !== context.usuario.id) {
        throw new Error("Sin suficientes permisos");
      }

      // Asignar estado
      input.estado = estado;

      // Guardar y retornar la tarea

      tarea = await Tarea.findOneAndUpdate({ _id: id }, input, { new: true });

      return tarea;
    },
    eliminarTarea: async (_, { id, input }, context) => {
      // Revisar si el tarea existe o no
      let tarea = await Tarea.findById(id);

      if (!tarea) {
        throw new Error("Tarea no encontrado");
      }
      // Revisar que si la persona que trata de editarlo, es el creador
      if (tarea.creador.toString() !== context.usuario.id) {
        throw new Error("Sin suficientes permisos");
      }

      // Eliminar
      await Tarea.findOneAndDelete({ _id: id });
      return "Tarea Eliminanda";
    },
  },
};

module.exports = resolvers;
