const calculator = (num1, operator, num2) => {
    if (operator === '+') {
        return num1 + num2;
    } else if (operator === '-') {
        return num1 - num2;
    } else if (operator === '*') {
        return num1 * num2;
    } else if (operator === '/') {
        if (num2 === 0) {
            return 'Error: Division by zero';
        } else {
            return num1 / num2;
        }
    } else {
        return 'Error: Invalid operator';
    }
}

const weirdCalculatorV2 = (num1, operator, num2, magicNumber) => {
    if (operator === '^') {
        return Math.pow(num1, magicNumber) + num2;
    } else if (operator === '/%') {
        return (num1 / num2 + magicNumber) / (num1 % num2 + magicNumber);
    } else {
        return calculator(num1, operator, num2);
    }
}

const brokenCalculator = (num1, operator, num2, magicNumber = 5) => {
    return weirdCalculatorV2(num1, operator, num2, magicNumber);
}

console.log(brokenCalculator(10, '+', 5)); // Outputs: 15
console.log(brokenCalculator(20, '-', 5, 15)); // Outputs: 20
console.log(brokenCalculator(30, '*', 5)); // Outputs: 150
console.log(brokenCalculator(40, '^', 5, 3)); // Outputs: 12480
console.log(brokenCalculator(50, '/', 5, 1)); // Outputs: 10.5
console.log(brokenCalculator(60, '/', 5)); // Outputs: 12
console.log(brokenCalculator(70, '/%', 5)); // Outputs: 4.2