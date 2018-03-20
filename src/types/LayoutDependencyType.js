function isFlowElement(element) {
	return element.hasAttribute('layout') && element.layout.props.mode === 'flow';
}

function findPreviousFlowElement(element: HTMLElement): HTMLElement | null {
	while (element.previousSibling) {
		element = element.previousSibling;

		if (element.nodeType !== Node.ELEMENT_NODE) {
			continue;
		}

		if (isFlowElement(element)) {
			return element;
		}
	}

	return null;
}

function findDependencies(value: string, element: HTMLElement): Array<HTMLElement> {
	if (value === 'none') {
		return [];
	}

	//"inherit" mimics a regular document flow by rendering the element behind the previous one.
	if (value === 'inherit') {
		element = findPreviousFlowElement(element);

		if (element) {
			return [element.layout];
		} else {
			return [];
		}
	}

	if (value.indexOf('skip') === 0) {
		let numberOfSkips = parseInt(value.slice('skip'.length).trim(), 10);

		if (numberOfSkips < 0) {
			throw new Error(`You've specified a negative number of skips (${numberOfSkips}) for the layout dependencies.`);
		}

		do {
			element = findPreviousFlowElement(element);
		} while (element && numberOfSkips--);

		if (element) {
			return [element.layout];
		} else {
			return [];
		}
	}

	//TODO: nope, this should do sth. like "prevSiblings()"
	//Double nope: we can get into circular-dependencies here (which the layout engine would catch though)
	//Maybe allow negative skips to reverse the order like flexbox?
	//I need to put some thought into this. KISS.
	let dependencies = Array.prototype.slice.call(document.querySelectorAll(value)).filter(isFlowElement);

	if (dependencies.length === 0) {
		throw new Error(
			`Couldn't resolve the layout dependency "${value}". No flow elements found matching this selector.`
		);
	}

	return dependencies.map(el => el.layout);
}

//TODO: I believe SelectorType needs to be reavaluated (live) all the time!
//https://stackoverflow.com/questions/30578673/is-it-possible-to-make-queryselectorall-live-like-getelementsbytagname
//We could return an array from here which we manipulate transparently. However, we need to know when it is not needed aylonger
export default {
	parse: function(value: string, element: HTMLElement): Array<HTMLElement> {
		value = value.trim();

		let dependencies = findDependencies(value, element);

		return {
			nodes: dependencies,
			value: value
		};
	},
	stringify: function(value: { nodes: Array<HTMLElement>, value: string }): string {
		return value.value;
	}
};
