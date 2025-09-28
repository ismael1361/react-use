import { InputGenerator, TimingConfig } from "@ismael1361/animation";
import { Color } from "@ismael1361/utils";

export type DOMElement = HTMLElement | SVGElement | null;

export type UnitType = "px" | "cm" | "mm" | "in" | "pt" | "pc" | "%" | "em" | "ex" | "ch" | "rem" | "vh" | "vw" | "vmin" | "vmax";

export type MarginDefinition = [number] | [number, number] | [number, number, number] | [number, number, number, number];

export interface ValueType<T = number> extends Omit<TimingConfig, "from" | "to"> {
	from?: T;
	to: T;
}

export interface ValueUnit<T = number> extends ValueType<T> {
	unit?: UnitType;
}

/**
 * Uma coleção de helpers de animação para manipular propriedades de elementos DOM.
 */
export interface DOMAnimationHelpers {
	/**
	 * Anima a propriedade `opacity` de um elemento DOM.
	 * @param value O valor inicial da opacidade.
	 * @param config Configurações da animação, como `to`, `duration`, `easing`.
	 * @returns Um gerador de animação.
	 * @example
	 * ```ts
	 * const myDiv = useRef(null);
	 * useAnimation(function*() {
	 *   yield* this.dom(myDiv).opacity(0, { to: 1, duration: 1000 });
	 * });
	 * ```
	 */
	opacity(value: number, config: ValueType<number>): InputGenerator;
	/**
	 * Anima a propriedade `width` de um elemento DOM.
	 * @param value O valor inicial da largura.
	 * @param config Configurações da animação, incluindo `to`, `duration`, e `unit` (padrão 'px').
	 * @returns Um gerador de animação.
	 * @example
	 * ```ts
	 * const myDiv = useRef(null);
	 * useAnimation(function*() {
	 *   // Anima a largura de 0 para 100 pixels
	 *   yield* this.dom(myDiv).width(0, { to: 100, duration: 500 });
	 *   // Anima a largura de 100% para 50%
	 *   yield* this.dom(myDiv).width(100, { to: 50, unit: '%', duration: 500 });
	 * });
	 * ```
	 */
	width(value: number, config: ValueUnit<number>): InputGenerator;
	/**
	 * Anima a propriedade `height` de um elemento DOM.
	 * @param value O valor inicial da altura.
	 * @param config Configurações da animação, incluindo `to`, `duration`, e `unit` (padrão 'px').
	 * @returns Um gerador de animação.
	 * @example
	 * ```ts
	 * const myDiv = useRef(null);
	 * useAnimation(function*() {
	 *   // Anima a altura de 0 para 200 pixels
	 *   yield* this.dom(myDiv).height(0, { to: 200, duration: 500 });
	 * });
	 * ```
	 */
	height(value: number, config: ValueUnit<number>): InputGenerator;
	/**
	 * Anima a propriedade `margin` de um elemento DOM.
	 * @param value A definição da margem inicial. Pode ser um array com 1, 2, 3 ou 4 valores.
	 * @param config Configurações da animação, incluindo `to` (margem final), `duration`, e `unit` (padrão 'px').
	 * @returns Um gerador de animação.
	 * @example
	 * ```ts
	 * const myDiv = useRef(null);
	 * useAnimation(function*() {
	 *   // Anima a margem de 0px para 10px em todos os lados
	 *   yield* this.dom(myDiv).margin([0], { to: [10], duration: 500 });
	 *   // Anima de 10px (vertical) 20px (horizontal) para 0
	 *   yield* this.dom(myDiv).margin([10, 20], { to: [0], duration: 500 });
	 * });
	 * ```
	 */
	margin(value: MarginDefinition, config: ValueUnit<MarginDefinition>): InputGenerator;
	marginTop(value: number, config: ValueUnit<number>): InputGenerator;
	marginBottom(value: number, config: ValueUnit<number>): InputGenerator;
	marginLeft(value: number, config: ValueUnit<number>): InputGenerator;
	marginRight(value: number, config: ValueUnit<number>): InputGenerator;
	backgroundColor(value: string | Color, config: ValueType<string | Color>): InputGenerator;
	backgroundPosition(value: [number, number], config: ValueUnit<[number, number]>): InputGenerator;
	backgroundPositionX(value: number, config: ValueUnit<number>): InputGenerator;
	backgroundPositionY(value: number, config: ValueUnit<number>): InputGenerator;
	backgroundSize(value: [number] | [number, number], config: ValueUnit<[number] | [number, number]>): InputGenerator;
}
