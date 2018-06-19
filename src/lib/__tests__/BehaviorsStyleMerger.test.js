import BehaviorsStyleMerger from 'lib/BehaviorsStyleMerger.js';

const behaviorOrder = ['foo', 'bar', 'baz'];

function createMerger() {
	const element = document.createElement('div');
	const merger = new BehaviorsStyleMerger(element, behaviorOrder);

	return {
		element,
		merger
	};
}

describe('regular properties', () => {
	test('adds and removes a single property', () => {
		const { element, merger } = createMerger();

		merger.setBehaviorStyle('foo', 'color', 'purple');

		expect(element.style.color).toBe('purple');

		merger.resetBehaviorStyle('foo', 'color');

		expect(element.style.color).toBe('');
	});

	test('reset is a noop when there is nothing to reset', () => {
		const { element, merger } = createMerger();

		expect(element.style.transform).toBe('');

		merger.resetBehaviorStyle('foo', 'color');

		expect(element.style.transform).toBe('');
	});

	test('overwrites a single property', () => {
		const { element, merger } = createMerger();

		merger.setBehaviorStyle('foo', 'color', 'purple');

		expect(element.style.color).toBe('purple');

		merger.setBehaviorStyle('foo', 'color', 'green');

		expect(element.style.color).toBe('green');
	});

	test('adds multiple and removes a single property', () => {
		const { element, merger } = createMerger();

		merger.setBehaviorStyle('foo', 'color', 'purple');
		merger.setBehaviorStyle('foo', 'zIndex', 1337);

		expect(element.style.color).toBe('purple');
		expect(element.style.zIndex).toBe('1337');

		merger.resetBehaviorStyle('foo', 'color');

		expect(element.style.color).toBe('');
		expect(element.style.zIndex).toBe('1337');
	});

	test('cleans up all properties', () => {
		const { element, merger } = createMerger();

		merger.setBehaviorStyle('foo', 'color', 'purple');
		merger.setBehaviorStyle('foo', 'zIndex', 1337);

		expect(element.style.color).toBe('purple');
		expect(element.style.zIndex).toBe('1337');

		merger.resetBehaviorStyles('foo');

		expect(element.style.color).toBe('');
		expect(element.style.zIndex).toBe('');
	});

	test('cleans up only the properties of one behavior', () => {
		const { element, merger } = createMerger();

		merger.setBehaviorStyle('foo', 'color', 'purple');
		merger.setBehaviorStyle('bar', 'zIndex', 1337);

		expect(element.style.color).toBe('purple');
		expect(element.style.zIndex).toBe('1337');

		merger.resetBehaviorStyles('foo');

		expect(element.style.color).toBe('');
		expect(element.style.zIndex).toBe('1337');
	});

	test('complains about two conflicting behaviors', () => {
		const { merger } = createMerger();

		const ce = console.error; //eslint-disable-line no-console

		let counter = 0;
		//eslint-disable-next-line no-console
		console.error = function() {
			counter++;
		};

		merger.setBehaviorStyle('foo', 'color', 'purple');
		merger.setBehaviorStyle('bar', 'color', 'green');

		expect(counter).toBe(1);

		console.error = ce; //eslint-disable-line no-console
	});
});

describe('transform', () => {
	test('adds prefixes', () => {
		const { element, merger } = createMerger();

		merger.setBehaviorStyle('foo', 'transform', 'rotate(45deg)');

		expect(element.style.transform).toBe('rotate(45deg)');
		expect(element.style.WebkitTransform).toBe('rotate(45deg)');
		expect(element.style.msTransform).toBe('rotate(45deg)');
	});

	test('merges transforms', () => {
		const { element, merger } = createMerger();

		merger.setBehaviorStyle('foo', 'transform', 'rotate(45deg)');
		merger.setBehaviorStyle('bar', 'transform', 'translate3d(100px, 100px, 0)');
		merger.setBehaviorStyle('baz', 'transform', 'scale(0.5)');

		expect(element.style.transform).toBe('rotate(45deg) translate3d(100px, 100px, 0) scale(0.5)');
	});

	test('reset a single transform', () => {
		const { element, merger } = createMerger();

		merger.setBehaviorStyle('foo', 'transform', 'rotate(45deg)');
		merger.setBehaviorStyle('bar', 'transform', 'translate3d(100px, 100px, 0)');
		merger.setBehaviorStyle('baz', 'transform', 'scale(0.5)');

		expect(element.style.transform).toBe('rotate(45deg) translate3d(100px, 100px, 0) scale(0.5)');

		merger.resetBehaviorStyle('bar', 'transform');

		expect(element.style.transform).toBe('rotate(45deg) scale(0.5)');
	});

	test('reset is a noop when there is nothing to reset', () => {
		const { element, merger } = createMerger();

		expect(element.style.transform).toBe('');

		merger.resetBehaviorStyle('foo', 'transform');

		expect(element.style.transform).toBe('');
	});

	test('overwrites a single transform', () => {
		const { element, merger } = createMerger();

		merger.setBehaviorStyle('foo', 'transform', 'rotate(45deg)');
		merger.setBehaviorStyle('bar', 'transform', 'translate3d(100px, 100px, 0)');
		merger.setBehaviorStyle('baz', 'transform', 'scale(0.5)');

		expect(element.style.transform).toBe('rotate(45deg) translate3d(100px, 100px, 0) scale(0.5)');

		merger.setBehaviorStyle('bar', 'transform', 'translate3d(200px, 200px, 0)');

		expect(element.style.transform).toBe('rotate(45deg) translate3d(200px, 200px, 0) scale(0.5)');
	});

	test('merges transforms in a consistent order (foo, bar, baz)', () => {
		const { element, merger } = createMerger();

		merger.setBehaviorStyle('bar', 'transform', 'translate3d(100px, 100px, 0)');
		merger.setBehaviorStyle('baz', 'transform', 'scale(0.5)');
		merger.setBehaviorStyle('foo', 'transform', 'rotate(45deg)');

		expect(element.style.transform).toBe('rotate(45deg) translate3d(100px, 100px, 0) scale(0.5)');
	});

	test('turns translate() into translate3d() but not for IE 9', () => {
		const { element, merger } = createMerger();

		merger.setBehaviorStyle('foo', 'transform', 'translate(100px, 100px)');
		merger.setBehaviorStyle('bar', 'transform', 'scale(1) translate(200px, 200px) scale(2)');
		merger.setBehaviorStyle(
			'baz',
			'transform',
			'scale(3) translate(300px, 300px) translate3d(400px, 400px, 400) scale(4)'
		);

		expect(element.style.transform).toBe(
			'translate3d(100px, 100px, 0) scale(1) translate3d(200px, 200px, 0) scale(2) scale(3) translate3d(300px, 300px, 0) translate3d(400px, 400px, 400) scale(4)'
		);
		expect(element.style.msTransform).toBe(
			'translate(100px, 100px) scale(1) translate(200px, 200px) scale(2) scale(3) translate(300px, 300px) translate3d(400px, 400px, 400) scale(4)'
		);
	});
});

describe('opacity', () => {
	test('multiplies opacity', () => {
		const { element, merger } = createMerger();

		merger.setBehaviorStyle('foo', 'opacity', 0.5);
		merger.setBehaviorStyle('bar', 'opacity', 0.5);

		expect(element.style.opacity).toBe('0.25');
	});

	test('reset is a noop when there is nothing to reset', () => {
		const { element, merger } = createMerger();

		expect(element.style.transform).toBe('');

		merger.resetBehaviorStyle('foo', 'opacity');

		expect(element.style.transform).toBe('');
	});
});
