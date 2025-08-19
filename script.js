class Calculator {
    constructor() {
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = '';
        this.waitingForOperand = false;
        this.history = '';
        
        this.currentElement = document.getElementById('current');
        this.historyElement = document.getElementById('history');
        
        this.updateDisplay();
        this.setupKeyboardListeners();
    }

    updateDisplay() {
        this.currentElement.textContent = this.formatNumber(this.currentInput);
        this.historyElement.textContent = this.history;
    }

    formatNumber(num) {
        if (num === '') return '0';
        
        // 숫자가 너무 길면 지수 표기법 사용
        if (Math.abs(parseFloat(num)) >= 1e10 || (Math.abs(parseFloat(num)) < 1e-6 && parseFloat(num) !== 0)) {
            return parseFloat(num).toExponential(6);
        }
        
        // 소수점 처리
        let formattedNum = num;
        if (num.includes('.')) {
            const parts = num.split('.');
            if (parts[1].length > 10) {
                formattedNum = parseFloat(num).toFixed(10).replace(/\.?0+$/, '');
            }
        }
        
        // 천단위 컴마 추가
        return this.addCommas(formattedNum);
    }

    addCommas(num) {
        // 문자열로 변환
        const numStr = String(num);
        
        // 음수 부호와 소수점 분리
        const isNegative = numStr.startsWith('-');
        const cleanNum = isNegative ? numStr.slice(1) : numStr;
        
        // 소수점으로 분리
        const parts = cleanNum.split('.');
        const integerPart = parts[0];
        const decimalPart = parts[1];
        
        // 정수 부분에 컴마 추가 (3자리마다)
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        
        // 결과 조합
        let result = formattedInteger;
        if (decimalPart !== undefined) {
            result += '.' + decimalPart;
        }
        
        return isNegative ? '-' + result : result;
    }

    removeCommas(num) {
        return String(num).replace(/,/g, '');
    }

    inputNumber(number) {
        if (this.waitingForOperand) {
            this.currentInput = number;
            this.waitingForOperand = false;
        } else {
            if (this.currentInput === '0') {
                this.currentInput = number;
            } else {
                this.currentInput += number;
            }
        }
        this.updateDisplay();
    }

    inputDecimal() {
        if (this.waitingForOperand) {
            this.currentInput = '0.';
            this.waitingForOperand = false;
        } else if (this.currentInput.indexOf('.') === -1) {
            this.currentInput += '.';
        }
        this.updateDisplay();
    }

    inputOperator(nextOperator) {
        const inputValue = parseFloat(this.removeCommas(this.currentInput));

        if (this.previousInput === '') {
            this.previousInput = this.removeCommas(this.currentInput);
        } else if (this.operator) {
            const result = this.performCalculation();
            
            if (result === null) return;
            
            this.currentInput = String(result);
            this.previousInput = String(result);
        }

        this.waitingForOperand = true;
        this.operator = nextOperator;
        
        // 히스토리 업데이트
        const operatorSymbol = this.getOperatorSymbol(nextOperator);
        this.history = `${this.formatNumber(this.previousInput)} ${operatorSymbol}`;
        
        this.updateDisplay();
    }

    getOperatorSymbol(operator) {
        switch (operator) {
            case '+': return '+';
            case '-': return '-';
            case '*': return '×';
            case '/': return '÷';
            default: return operator;
        }
    }

    performCalculation() {
        const prev = parseFloat(this.removeCommas(this.previousInput));
        const current = parseFloat(this.removeCommas(this.currentInput));

        if (isNaN(prev) || isNaN(current)) return null;

        let result;
        switch (this.operator) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '*':
                result = prev * current;
                break;
            case '/':
                if (current === 0) {
                    alert('0으로 나눌 수 없습니다');
                    return null;
                }
                result = prev / current;
                break;
            default:
                return null;
        }

        // 결과가 너무 큰 경우 처리
        if (!isFinite(result)) {
            alert('결과가 너무 큽니다');
            return null;
        }

        return result;
    }

    calculate() {
        if (this.operator && !this.waitingForOperand) {
            const result = this.performCalculation();
            
            if (result === null) return;
            
            // 히스토리 완성
            const operatorSymbol = this.getOperatorSymbol(this.operator);
            this.history = `${this.formatNumber(this.previousInput)} ${operatorSymbol} ${this.formatNumber(this.currentInput)} =`;
            
            this.currentInput = String(result);
            this.previousInput = '';
            this.operator = '';
            this.waitingForOperand = true;
            
            this.updateDisplay();
        }
    }

    clearAll() {
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = '';
        this.waitingForOperand = false;
        this.history = '';
        this.updateDisplay();
    }

    clearEntry() {
        this.currentInput = '0';
        this.updateDisplay();
    }

    backspace() {
        if (!this.waitingForOperand) {
            if (this.currentInput.length > 1) {
                this.currentInput = this.currentInput.slice(0, -1);
            } else {
                this.currentInput = '0';
            }
            this.updateDisplay();
        }
    }

    toggleSign() {
        if (this.currentInput !== '0') {
            // 컴마 제거 후 부호 변경
            const cleanInput = this.removeCommas(this.currentInput);
            if (cleanInput.startsWith('-')) {
                this.currentInput = cleanInput.slice(1);
            } else {
                this.currentInput = '-' + cleanInput;
            }
            this.updateDisplay();
        }
    }

    setupKeyboardListeners() {
        document.addEventListener('keydown', (event) => {
            const key = event.key;
            
            // 숫자 입력
            if (key >= '0' && key <= '9') {
                this.inputNumber(key);
            }
            // 소수점
            else if (key === '.') {
                this.inputDecimal();
            }
            // 연산자
            else if (key === '+' || key === '-' || key === '*' || key === '/') {
                this.inputOperator(key);
            }
            // 계산 (Enter 또는 =)
            else if (key === 'Enter' || key === '=') {
                event.preventDefault();
                this.calculate();
            }
            // 삭제 (Backspace)
            else if (key === 'Backspace') {
                event.preventDefault();
                this.backspace();
            }
            // 전체 삭제 (Escape 또는 Delete)
            else if (key === 'Escape' || key === 'Delete') {
                this.clearAll();
            }
            // CE (Ctrl+Backspace)
            else if (event.ctrlKey && key === 'Backspace') {
                event.preventDefault();
                this.clearEntry();
            }
        });
    }
}

// 전역 함수들 (HTML onclick에서 사용)
let calculator;

function inputNumber(number) {
    calculator.inputNumber(number);
}

function inputDecimal() {
    calculator.inputDecimal();
}

function inputOperator(operator) {
    calculator.inputOperator(operator);
}

function calculate() {
    calculator.calculate();
}

function clearAll() {
    calculator.clearAll();
}

function clearEntry() {
    calculator.clearEntry();
}

function backspace() {
    calculator.backspace();
}

function toggleSign() {
    calculator.toggleSign();
}

// 페이지 로드 시 계산기 초기화
document.addEventListener('DOMContentLoaded', () => {
    calculator = new Calculator();
});
