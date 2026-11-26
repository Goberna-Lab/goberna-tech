// Trabajador (Web Worker) que calcula el relieve de la portada sin trabar la página.
import { hornearRelieve } from "./relieve.js";

self.onmessage = ({ data }) => {
  const { alt, datos } = hornearRelieve(data);
  self.postMessage({ id: data.id, alt, datos }, [alt.buffer, datos.buffer]);
};
