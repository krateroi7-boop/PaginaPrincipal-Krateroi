// Respuesta local para cuando la API conversacional no esta disponible.
// No diagnostica ni promete resultados: orienta hacia el formulario.
export function responderGuiado(mensaje) {
  const normal = mensaje.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const prefijo = 'Respuesta guiada: ';

  if (/legal|dato|privacidad|ley|contrato|norma|cumplimiento|ciberseguridad/.test(normal)) {
    return prefijo + 'Podemos revisar proteccion de datos, riesgos legales digitales y estructuras estables de sistemas. ¿Buscas una auditoria o apoyo para implementar cambios? Puedes detallar el caso en el formulario.';
  }
  if (/agente|inteligencia artificial|\bia\b|chatbot|bot/.test(normal)) {
    return prefijo + 'Podemos evaluar agentes de IA, su integracion y capacitacion del equipo. ¿Que tarea deberia resolver el agente y con que sistemas trabajaria? Deja el contexto en el formulario.';
  }
  if (/servidor|nube|cloud|infraestructura|base de datos|sql/.test(normal)) {
    return prefijo + 'Podemos revisar servidores locales o en la nube, bases de datos e integraciones. ¿Que sistema usan hoy y que problema necesitan resolver? Describelo en el formulario.';
  }
  if (/automat|excel|whatsapp|correo|repet|inventario|reserva|proceso|integr/.test(normal)) {
    return prefijo + 'Podemos mapear el flujo y evaluar una automatizacion o integracion. ¿Que evento inicia el proceso y que resultado deberia producir? Cuentanoslo en el formulario.';
  }
  return prefijo + 'Podemos revisar tu necesidad digital, tecnica o legal. Indica el proceso, las herramientas actuales y el resultado esperado en el formulario de contacto.';
}
