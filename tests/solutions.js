// ════════════════════════════════════════════════════════
// tests/solutions.js — Solucions correctes per a cada exercici
//
// Clau: goalId (p.ex. 'cap-1-ex', 'repte-1')
// Valor: codi Python que, combinat amb el testcode de l'exercici (si n'hi ha),
//        ha de passar tots els test cases definits a la pàgina.
//
// Aquest fitxer l'utilitza tests/test-exercises.html per verificar que
// cada exercici té una solució correcta i que els test cases són consistents.
// ════════════════════════════════════════════════════════

window.SOLUTIONS = {

  // ── Capítols ──

  'cap-1-ex': `print("Em dic PyCat.")
print("Tinc 0 anys.")
print()
print("Aprendrem Python junts!")
`,

  'cap-3-ex': `a = int(input())
b = int(input())
print("Suma:", a + b)
print("Diferència:", a - b)
print("Producte:", a * b)
`,

  'cap-4-ex': `nota = int(input())
if nota <= 4:
    print("Suspens")
elif nota <= 6:
    print("Aprovat")
elif nota <= 8:
    print("Notable")
else:
    print("Excel·lent")
`,

  'cap-5-ex': `secret = 7
intent = int(input())
while intent != secret:
    if intent < secret:
        print("Més gran!")
    else:
        print("Més petit!")
    intent = int(input())
print("Encertat!")
`,

  'cap-6-ex': `n = int(input())
for i in range(1, n + 1):
    print("*" * i)
`,

  'cap-7-ex': `paraula = input()
paraula = paraula.lower()
comptador = 0
for c in paraula:
    if c in "aeiou":
        comptador += 1
print(comptador)
`,

  'cap-8-ex': `numeros = []
for i in range(5):
    numeros.append(int(input()))
print(sum(numeros) / len(numeros))
`,

  'cap-9-ex': `def es_primer(n):
    if n < 2:
        return False
    for i in range(2, n):
        if n % i == 0:
            return False
    return True
`,

  // ── Reptes ──

  'repte-1': `print("Hola, món!")
print("Això és Python.")
print("M'encanta programar!")
`,

  'repte-2': `nom = input()
print("Hola, " + nom + "!")
`,

  'repte-3': `a = int(input())
b = int(input())
print("Suma:", a + b)
print("Resta:", a - b)
print("Producte:", a * b)
print("Divisió:", a / b)
`,

  'repte-4': `anys = int(input())
print("Mesos:", anys * 12)
print("Dies:", anys * 365)
`,

  'repte-5': `euros = float(input())
dolars = euros * 1.08
print(f"{euros} € = {dolars:.2f} $")
`,

  'repte-6': `n = int(input())
if n % 2 == 0:
    print("Parell")
else:
    print("Senar")
`,

  'repte-7': `a = int(input())
b = int(input())
c = int(input())
print(max(a, b, c))
`,

  'repte-8': `n = int(input())
for i in range(n, -1, -1):
    print(i)
print("Boom!")
`,

  'repte-9': `n = int(input())
for i in range(1, 11):
    print(n, "x", i, "=", n * i)
`,

  'repte-10': `n = int(input())
for i in range(1, n + 1):
    print("*" * i)
`,

  'repte-11': `text = input()
comptador = 0
for c in text.lower():
    if c in "aeiou":
        comptador += 1
print("Vocals:", comptador)
`,

  'repte-12': `paraula = input()
print("Original:", paraula)
print("Invertida:", paraula[::-1])
`,

  'repte-13': `nombres = []
while True:
    entrada = input()
    if entrada == "fi":
        break
    nombres.append(float(entrada))
if not nombres:
    print("Cap nombre")
else:
    mitjana = sum(nombres) / len(nombres)
    print(f"Mitjana: {mitjana:.2f}")
`,

  'repte-14': `def es_palindrom(text):
    t = text.lower()
    return t == t[::-1]

paraula = input()
if es_palindrom(paraula):
    print("Sí")
else:
    print("No")
`,

  'repte-15': `n = int(input())
for i in range(1, n + 1):
    if i % 15 == 0:
        print("FizzBuzz")
    elif i % 3 == 0:
        print("Fizz")
    elif i % 5 == 0:
        print("Buzz")
    else:
        print(i)
`,

};
