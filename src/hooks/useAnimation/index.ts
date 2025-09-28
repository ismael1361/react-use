import {
	Easing,
	InputGenerator,
	create,
	timeSincePreviousFrame,
	timing,
	wait,
	waitUntil,
	delay,
	parallel,
	all,
	any,
	chain,
	stagger,
	sequence,
	loop,
	SharedValues,
	AnimationState,
	AnimationProps,
} from "@ismael1361/animation";
import { useMemo, useRef, useState } from "react";
import { BoxShadowDefinition, DOMAnimationHelpers, DOMElement, MarginDefinition, UnitType } from "./Types";
import { Color, interpolate } from "@ismael1361/utils";

const parseBoxShadow = (shadowString: string): BoxShadowDefinition[] => {
	const shadows: BoxShadowDefinition[] = [];

	const parseUnit = (unit: string): [number, UnitType] => {
		const [n, u = ""] = (unit
			.replace(/\s/gi, "")
			.match(/([\.\-0-9]+)|(\S+)/g)
			?.map((v, i) => (i === 0 ? parseFloat(v) : v)) || [0, "px"]) as any;

		return [n, u];
	};

	shadowString
		.match(/((?:[^\s\,\(\)]+|\([^\(\)]*\))+)|(\,)/g)
		?.reduce(
			(a: string[][], b: string) => {
				if (b === ",") a.push([]);
				else a[a.length - 1].push(b);
				return a;
			},
			[[]],
		)
		.map((l) => l.join(" "))
		.forEach((shadowPart) => {
			const regex = /(inset\s*)?(-?\d+\.?\d*(?:px|em|rem|vh|vw|%)?)\s+(-?\d+\.?\d*(?:px|em|rem|vh|vw|%)?)\s+(-?\d+\.?\d*(?:px|em|rem|vh|vw|%)?)?\s*(-?\d+\.?\d*(?:px|em|rem|vh|vw|%)?)?\s*(.*)/i;
			const match = shadowPart.trim().match(regex);

			if (match) {
				shadows.push({
					inset: !!match[1],
					offsetX: parseUnit(match[2]),
					offsetY: parseUnit(match[3]),
					blurRadius: parseUnit(match[4] || "0"),
					spreadRadius: parseUnit(match[5] || "0"),
					color: match[6] ? match[6].trim() : "initial",
				});
			}
		});
	return shadows;
};

const ProcessProps = {
	/**
	 * Easing function to use.
	 */
	Easing,

	/**
	 * Obtém o tempo decorrido (em milissegundos) desde o quadro de animação anterior.
	 * Usado dentro de um gerador de animação para controlar o fluxo de tempo.
	 *
	 * @returns {InputGenerator<number>} Um gerador que produz o tempo delta em milissegundos.
	 * @example
	 * ```ts
	 * const deltaTime = yield* this.timeSincePreviousFrame();
	 * console.log(`O último quadro demorou ${deltaTime}ms para renderizar.`);
	 * ```
	 */
	timeSincePreviousFrame,

	/**
	 * Anima propriedade de um `SharedValue<number>` ou executa uma função de retorno de chamada com o valor animado.
	 *
	 * @param {SharedValue<number> | TimingCallback} value `SharedValue<number>` ou uma função de retorno de chamada que recebe o valor atual e retorna `true` para cancelar a animação.
	 * @param {TimingConfig} [config] Configurações da animação como `from`, `to`, `duration`, `easing` e `delay`.
	 * @returns {InputGenerator} Um gerador que, quando executado, realiza a animação.
	 * @example
	 * ```ts
	 * // Anima a opacidade de 0 para 1 em 500ms.
	 * const opacity = new SharedValue(0);
	 *
	 * // Usando SharedValue diretamente
	 * yield* this.timing(opacity, { to: 1, duration: 500 });
	 *
	 * // Usando uma função de retorno de chamada
	 * yield* this.timing((val) => {
	 *   console.log(`Current value: ${val}`);
	 *   opacity.value = val;
	 *   return val > 0.8; // Cancela a animação quando o valor ultrapassar 0.8
	 * }, { to: 1, duration: 1000 });
	 * ```
	 */
	timing,

	/**
	 * Pausa a execução da animação por uma determinada duração.
	 *
	 * @param {number} [duration=1000] A duração da pausa em milissegundos.
	 * @returns {InputGenerator} Um gerador que, quando executado, realiza a pausa.
	 * @example
	 * ```ts
	 * console.log("Início da pausa.");
	 * yield* this.wait(1000); // Espera por 1 segundo.
	 * console.log("Fim da pausa.");
	 * ```
	 */
	wait,

	/**
	 * Pausa a execução da animação até que uma condição em um `SharedValue<boolean>` seja atendida.
	 *
	 * @param {SharedValue<boolean>} value O valor booleano compartilhado a ser observado.
	 * @param {boolean} [invert=false] Se `true`, espera até que o valor se torne `false`. Por padrão, espera até que se torne `true`.
	 * @returns {InputGenerator} Um gerador que, quando executado, realiza a espera.
	 * @example
	 * ```ts
	 * const isReady = new SharedValue(false);
	 * // Em outro lugar do código, isReady.value será definido como true.
	 *
	 * // Espera até isReady.value se tornar true
	 * yield* this.waitUntil(isReady);
	 * console.log("A condição foi atendida!");
	 *
	 * // Exemplo com 'invert'
	 * const isVisible = new SharedValue(true);
	 * // Espera até isVisible.value se tornar false
	 * yield* this.waitUntil(isVisible, true);
	 * console.log("O elemento não está mais visível.");
	 * ```
	 */
	waitUntil,

	/**
	 * Cria uma pausa e, opcionalmente, executa outra animação em seguida.
	 * É um atalho para combinar `wait` com outra animação.
	 *
	 * @param {number} [duration=1000] A duração da pausa em milissegundos.
	 * @param {Input} [animation] Uma animação (gerador) opcional para executar após o atraso.
	 * @returns {InputGenerator} Um gerador que, quando executado, realiza o atraso e a animação subsequente.
	 * @see {@link wait}
	 * @example
	 * ```ts
	 * // Apenas espera por 500ms
	 * yield* this.delay(500);
	 *
	 * // Espera 1 segundo e depois inicia uma animação de opacidade.
	 * const opacity = new SharedValue(0);
	 * yield* this.delay(1000, () => this.timing(opacity, { to: 1 }));
	 * ```
	 */
	delay,

	/**
	 * Executa múltiplas animações (geradores) em paralelo.
	 * A execução termina quando todas as animações filhas tiverem sido concluídas.
	 *
	 * @param {...Input} animations Uma sequência de geradores de animação a serem executados.
	 * @returns {InputGenerator} Um gerador que, quando executado, gerencia as animações paralelas.
	 * @example
	 * ```ts
	 * const opacity = new SharedValue(0);
	 * const scale = new SharedValue(0.5);
	 *
	 * yield* this.parallel(
	 *   () => this.timing(opacity, { to: 1, duration: 1000 }),
	 *   () => this.timing(scale, { to: 1, duration: 1000 })
	 * );
	 * // Ambas as animações de opacidade e escala ocorrerão simultaneamente.
	 * ```
	 */
	parallel,

	/**
	 * Um alias para `parallel`. Executa múltiplas animações em paralelo.
	 * A execução termina quando todas as animações filhas tiverem sido concluídas.
	 *
	 * @param {...Input} animations Uma sequência de geradores de animação a serem executados.
	 * @returns {InputGenerator} Um gerador que, quando executado, gerencia as animações paralelas.
	 * @see {@link parallel}
	 * @example
	 * ```ts
	 * const opacity = new SharedValue(0);
	 * const scale = new SharedValue(0.5);
	 *
	 * yield* this.all(
	 *   () => this.timing(opacity, { to: 1, duration: 1000 }),
	 *   () => this.timing(scale, { to: 1, duration: 1000 })
	 * );
	 * ```
	 */
	all,

	/**
	 * Executa múltiplas animações (geradores) em paralelo e termina assim que a primeira delas for concluída.
	 * As outras animações são interrompidas.
	 *
	 * @param {...Input} animations Uma sequência de geradores de animação a serem executados.
	 * @returns {InputGenerator} Um gerador que, quando executado, gerencia as animações concorrentes.
	 * @example
	 * ```ts
	 * // Espera por um clique do usuário ou por um timeout de 5 segundos, o que ocorrer primeiro.
	 * const hasClicked = new SharedValue(false);
	 *
	 * yield* this.any(
	 *   () => this.waitUntil(hasClicked),
	 *   () => this.wait(5000)
	 * );
	 *
	 * if (hasClicked.value) {
	 *   console.log("O usuário clicou!");
	 * } else {
	 *   console.log("O tempo esgotou.");
	 * }
	 * ```
	 */
	any,

	/**
	 * Executa múltiplas animações (geradores) em sequência, uma após a outra.
	 *
	 * @param {...Input} animations Uma sequência de geradores de animação a serem executados.
	 * @returns {InputGenerator} Um gerador que, quando executado, gerencia a cadeia de animações.
	 * @example
	 * ```ts
	 * const opacity = new SharedValue(0);
	 * const scale = new SharedValue(0.5);
	 *
	 * // Primeiro, anima a opacidade. Quando terminar, anima a escala.
	 * yield* this.chain(
	 *   () => this.timing(opacity, { to: 1, duration: 500 }),
	 *   () => this.timing(scale, { to: 1, duration: 500 })
	 * );
	 * ```
	 */
	chain,

	/**
	 * Executa múltiplas animações em paralelo, mas com um atraso escalonado entre o início de cada uma.
	 *
	 * @param {number} delayMs O atraso em milissegundos entre o início de cada animação.
	 * @param {...Input} animations Uma sequência de geradores de animação a serem executados.
	 * @returns {InputGenerator} Um gerador que, quando executado, gerencia as animações escalonadas.
	 * @example
	 * ```ts
	 * const opacity1 = new SharedValue(0);
	 * const opacity2 = new SharedValue(0);
	 *
	 * // A segunda animação começará 200ms após o início da primeira.
	 * yield* this.stagger(200,
	 *   () => this.timing(opacity1, { to: 1, duration: 500 }),
	 *   () => this.timing(opacity2, { to: 1, duration: 500 })
	 * );
	 * ```
	 */
	stagger,

	/**
	 * Executa múltiplas animações em sequência, com um atraso definido entre o fim de uma e o início da próxima.
	 *
	 * @param {number} delayMs O atraso em milissegundos entre cada animação na sequência.
	 * @param {...Input} animations Uma sequência de geradores de animação a serem executados.
	 * @returns {InputGenerator} Um gerador que, quando executado, gerencia a sequência de animações.
	 * @see {@link chain}
	 * @example
	 * ```ts
	 * const value = new SharedValue(0);
	 *
	 * // Anima para 1, espera 200ms, depois anima de volta para 0.
	 * yield* this.sequence(200,
	 *   () => this.timing(value, { to: 1, duration: 500 }),
	 *   () => this.timing(value, { to: 0, duration: 500 })
	 * );
	 * ```
	 */
	sequence,

	/**
	 * Executa uma animação (gerador) repetidamente.
	 *
	 * @overload
	 * @param {LoopCallback} factory Uma função que retorna o gerador da animação para um loop infinito.
	 * @returns {InputGenerator}
	 *
	 * @overload
	 * @param {number} iterations O número de vezes que a animação deve repetir.
	 * @param {LoopCallback} factory Uma função que retorna o gerador da animação a ser executada em cada iteração.
	 * @returns {InputGenerator}
	 *
	 * @example
	 * ```ts
	 * const rotation = new SharedValue(0);
	 *
	 * // Gira um elemento 3 vezes
	 * yield* this.loop(3, () => this.timing(rotation, { to: 360, duration: 1000 }));
	 *
	 * // Anima a opacidade para cima e para baixo infinitamente
	 * const opacity = new SharedValue(0);
	 * yield* this.loop(() => this.chain(
	 *   () => this.timing(opacity, { to: 1, duration: 500 }),
	 *   () => this.timing(opacity, { to: 0, duration: 500 })
	 * ));
	 * ```
	 */
	loop,

	/**
	 * Cria um conjunto de helpers de animação para um elemento DOM específico.
	 * Isso permite encadear animações diretamente em um elemento ou ref do React.
	 *
	 * @param {DOMElement | React.RefObject<DOMElement>} element O elemento DOM a ser animado, ou uma ref do React que aponta para ele.
	 * @returns {DOMAnimationHelpers} Um objeto com métodos de animação específicos para o DOM (`opacity`, `width`, `height`, `margin`).
	 * @example
	 * ```tsx
	 * const myDiv = useRef(null);
	 *
	 * useAnimation(function*() {
	 *   // Anima a opacidade do div de 0 para 1
	 *   yield* this.dom(myDiv).opacity(0, { to: 1, duration: 1000 });
	 *
	 *   // Em paralelo, anima a largura
	 *   yield* this.dom(myDiv).width(100, { to: 200, unit: 'px', duration: 1000 });
	 * });
	 *
	 * return <div ref={myDiv} style={{ width: 100, height: 100, backgroundColor: 'blue' }} />;
	 * ```
	 */
	dom(element: DOMElement | React.RefObject<DOMElement>): DOMAnimationHelpers {
		const e = element instanceof Element ? element : element?.current;
		const self = this;

		return {
			opacity(value, config) {
				return self.timing(
					(i) => {
						if (e) e.style.opacity = i.toFixed(2);
					},
					{
						from: value,
						...(config || {}),
					},
				);
			},
			width(value, config) {
				const { unit = "px", ...conf } = config || {};
				return self.timing(
					(i) => {
						if (e) e.style.width = i.toFixed(2) + unit;
					},
					{
						from: value,
						...conf,
					},
				);
			},
			height(value, config) {
				const { unit = "px", ...conf } = config || {};
				return self.timing(
					(i) => {
						if (e) e.style.height = i.toFixed(2) + unit;
					},
					{
						from: value,
						...conf,
					},
				);
			},
			margin(value, config) {
				const { from, to, unit = "px", ...conf } = config || {};

				const parseMargin = (m: MarginDefinition) => ({ top: m[0], right: m[1] || m[0], bottom: m[2] || m[0], left: m[3] || m[1] || m[0] });

				const fromValue = { ...parseMargin(value), ...parseMargin(from || value) };
				const toValue = parseMargin(to);

				return self.timing(
					(i) => {
						const top = interpolate(i, [0, 1], [fromValue.top, toValue.top]);
						const right = interpolate(i, [0, 1], [fromValue.right, toValue.right]);
						const bottom = interpolate(i, [0, 1], [fromValue.bottom, toValue.bottom]);
						const left = interpolate(i, [0, 1], [fromValue.left, toValue.left]);

						if (e) e.style.margin = [top, right, bottom, left].map((v) => v.toFixed(2) + unit).join(" ");
					},
					{
						from: 0,
						to: 1,
						...conf,
					},
				);
			},
			marginTop(value, config) {
				const { unit = "px", ...conf } = config || {};
				return self.timing(
					(i) => {
						if (e) e.style.marginTop = i.toFixed(2) + unit;
					},
					{
						from: value,
						...conf,
					},
				);
			},
			marginBottom(value, config) {
				const { unit = "px", ...conf } = config || {};
				return self.timing(
					(i) => {
						if (e) e.style.marginBottom = i.toFixed(2) + unit;
					},
					{
						from: value,
						...conf,
					},
				);
			},
			marginLeft(value, config) {
				const { unit = "px", ...conf } = config || {};
				return self.timing(
					(i) => {
						if (e) e.style.marginLeft = i.toFixed(2) + unit;
					},
					{
						from: value,
						...conf,
					},
				);
			},
			marginRight(value, config) {
				const { unit = "px", ...conf } = config || {};
				return self.timing(
					(i) => {
						if (e) e.style.marginRight = i.toFixed(2) + unit;
					},
					{
						from: value,
						...conf,
					},
				);
			},
			backgroundColor(value, config) {
				const { from, to, ...conf } = config || {};
				const fromColor = new Color(from || value);

				return self.timing(
					(i) => {
						const color = fromColor.blend(to, i);
						if (e) e.style.backgroundColor = color.toString();
					},
					{
						from: 0,
						to: 1,
						...conf,
					},
				);
			},
			backgroundPosition(value, config) {
				const { from, to, unit = "px", ...conf } = config || {};
				const fromValue = from || value;
				const toValue = to || value;

				return self.timing(
					(i) => {
						const x = interpolate(i, [0, 1], [fromValue[0], toValue[0]]);
						const y = interpolate(i, [0, 1], [fromValue[1], toValue[1]]);

						if (e) e.style.backgroundPosition = [x.toFixed(2) + unit, y.toFixed(2) + unit].join(" ");
					},
					{
						from: 0,
						to: 1,
						...conf,
					},
				);
			},
			backgroundPositionX(value, config) {
				const { unit = "px", ...conf } = config || {};
				return self.timing(
					(i) => {
						if (e) e.style.backgroundPositionX = i.toFixed(2) + unit;
					},
					{
						from: value,
						...conf,
					},
				);
			},
			backgroundPositionY(value, config) {
				const { unit = "px", ...conf } = config || {};
				return self.timing(
					(i) => {
						if (e) e.style.backgroundPositionY = i.toFixed(2) + unit;
					},
					{
						from: value,
						...conf,
					},
				);
			},
			backgroundSize(value, config) {
				const { from, to, unit = "px", ...conf } = config || {};
				const fromValue = [from?.[0] || value[0], from?.[1] || from?.[0] || value[1] || value[0]];
				const toValue = [to?.[0] || value[0], to?.[1] || to?.[0] || value[1] || value[0]];

				return self.timing(
					(i) => {
						const width = interpolate(i, [0, 1], [fromValue[0], toValue[0]]);
						const height = interpolate(i, [0, 1], [fromValue[1], toValue[1]]);

						if (e) e.style.backgroundSize = [width.toFixed(2) + unit, height.toFixed(2) + unit].join(" ");
					},
					{
						from: 0,
						to: 1,
						...conf,
					},
				);
			},
		};
	},
};

type AnimationFnProps = typeof ProcessProps;

type AnimationFn<S extends AnimationState> = (this: AnimationFnProps, state: SharedValues<S>["current"]) => InputGenerator;

/**
 * Um hook do React para criar e gerenciar animações complexas de forma declarativa.
 *
 * Este hook integra a biblioteca `@ismael1361/animation` ao ciclo de vida de um componente React,
 * permitindo a criação de animações baseadas em geradores que podem ser controladas facilmente.
 * Ele gerencia o estado da animação, garante que o componente seja re-renderizado quando os valores
 * da animação mudam e lida com a limpeza de recursos.
 *
 * @template S O tipo (shape) do objeto de estado da animação.
 * @param {AnimationFn<S>} animation Uma função geradora que define a lógica da animação.
 *   Dentro desta função, `this` é vinculado a um conjunto de utilitários de animação (como `timing`, `parallel`, `sequence`, etc.)
 *   e o primeiro argumento (`state`) fornece acesso aos `SharedValue`s individuais do estado.
 * @param {S} [state={}] O objeto de estado inicial para a animação. Cada propriedade se tornará um `SharedValue`.
 * @param {React.DependencyList} [deps=[]] Uma lista de dependências. Se qualquer uma dessas dependências mudar,
 *   a animação será recriada. Semelhante ao `useMemo`.
 * @returns {AnimationProps<S>} A instância do controlador de animação. Use seus métodos (`.start()`, `.stop()`, etc.)
 *   para controlar a animação e acesse `.state[key].value` para obter os valores atuais para renderização.
 *
 * @example
 * ```tsx
 * import React from 'react';
 * import { useAnimation } from '@ismael1361/react-use';
 *
 * const FadingBox = () => {
 *   const animation = useAnimation(
 *     function* (state) {
 *       // Anima a opacidade de 0 a 1 e de volta para 0, em um loop infinito.
 *       yield* this.loop(() =>
 *         this.sequence(500,
 *           () => this.timing(state.opacity, { to: 1, duration: 1000 }),
 *           () => this.timing(state.opacity, { to: 0, duration: 1000 })
 *         )
 *       );
 *     },
 *     { opacity: 0 } // Estado inicial
 *   );
 *
 *   const style = {
 *     width: 100,
 *     height: 100,
 *     backgroundColor: 'tomato',
 *     // Acessa o valor atual da animação para aplicar ao estilo
 *     opacity: animation.state.opacity.value,
 *   };
 *
 *   return <div style={style} />;
 * };
 * ```
 */
export const useAnimation = <S extends AnimationState>(animation: AnimationFn<S>, state: S = {} as S, deps: React.DependencyList = []) => {
	const [render, setRender] = useState({});
	const getRef = useRef<AnimationProps<S> | null>();

	const gen = useMemo<AnimationProps<S>>(() => {
		if (getRef.current) {
			getRef.current.destroy();
		}

		getRef.current = create(animation.bind(ProcessProps) as any, state);

		getRef.current.onChange(() => {
			setRender({});
		});

		getRef.current.restart();

		return getRef.current;
	}, deps);

	return useMemo(() => gen, [gen, render]);
};
