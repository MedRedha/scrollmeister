export default class PositionBehavior {
	static get schema() {
		return {};
	}

	static get dependencies() {
		return ['layout'];
	}

	constructor(element) {
		this.element = element;
		this.element.layout.bam();
	}

	detach() {}

	scroll() {}

	wup() {
		console.log('dup');
	}
}
