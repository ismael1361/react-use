import { useState } from "react";

/**
 * Um hook customizado do React que persiste o estado no `localStorage` do navegador.
 * Ele se comporta como o `useState`, mas o valor é automaticamente salvo no `localStorage`
 * sempre que muda e é recuperado na montagem do componente.
 *
 * @template T O tipo do valor a ser armazenado.
 * @param {string} key A chave sob a qual o valor é armazenado no `localStorage`.
 * @param {T} initialValue O valor inicial a ser usado se nenhum valor for encontrado no `localStorage`.
 * @returns {[T, (value: T | ((val: T) => T)) => void]} Uma tupla contendo o valor armazenado e uma função para atualizá-lo, espelhando a API do `useState`.
 *
 * @example
 * ```jsx
 * function UserSettings() {
 *   const [name, setName] = useLocalStorage('userName', 'Visitante');
 *
 *   return (
 *     <div>
 *       <h1>Olá, {name}!</h1>
 *       <input
 *         type="text"
 *         placeholder="Digite seu nome"
 *         value={name}
 *         onChange={(e) => setName(e.target.value)}
 *       />
 *       <p>Este nome será lembrado na próxima vez que você visitar.</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    };

    return [storedValue, setValue];
};
