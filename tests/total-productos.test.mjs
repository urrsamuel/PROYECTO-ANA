import assert from "node:assert/strict";
import { test } from "node:test";
import { calcularTotalProductos } from "../lib/total-productos.mjs";

test("suma los precios de todos los productos", () => {
  const productos = [
    { nombre: "Aretes", precio: 25000 },
    { nombre: "Collar", precio: 35000 },
    { nombre: "Pulsera", precio: 22000 },
  ];

  assert.equal(calcularTotalProductos(productos), 82000);
});

test("acepta precios recibidos como texto", () => {
  const productos = [{ nombre: "Cadena", precio: "40000" }];

  assert.equal(calcularTotalProductos(productos), 40000);
});

test("el total es cero cuando no hay productos", () => {
  assert.equal(calcularTotalProductos([]), 0);
});
