// @flow

import assign from 'ponies/Object.assign.js';
import Behavior from 'behaviors/Behavior.js';

import type ScrollState from 'lib/ScrollState.js';
import type { CSSLength } from 'types/CSSLengthType.js';

type Keyframe = {
	anchor: 'string',
	offset: CSSLength,
	value: number
};

type Props = {
	progress: Array<Keyframe>,
	opacity: Array<Keyframe>,
	rotate: Array<Keyframe>,
	scale: Array<Keyframe>,
	alpha: Array<Keyframe>,
	beta: Array<Keyframe>,
	gamma: Array<Keyframe>,
	delta: Array<Keyframe>,
	epsilon: Array<Keyframe>
};

//Parameters are a comma separated list of keyframes.
//A keyframe is defined by a position inside the viewport and a value.
//E.g. "alpha: top 1, bottom 0;" would set the alpha parameter to 1
//when the top is aligned with the top of the viewport and to 0 when the bottoms are aligned.
//The values inbetween are interpolated, hence the name of the behavior.
const keyframesSchema = {
	type: [[{ anchor: 'string' }, { offset: 'csslength' }, { value: 'number' }]],
	expand: function(rawProperties) {
		if (rawProperties.length === 1) {
			//Default offset to 0 and value to 1.
			rawProperties.push('0', '1');
			return true;
		} else if (rawProperties.length === 2) {
			//Default offset to 0.
			rawProperties.splice(1, 0, '0');
			return true;
		}

		return false;
	},
	default: ''
};

export default class InterpolateBehavior extends Behavior {
	props: Props;

	static get schema(): any {
		return {
			progress: assign({}, keyframesSchema, { default: 'bottom -100% 0, top 100% 1' }),
			opacity: keyframesSchema,
			rotate: keyframesSchema,
			scale: keyframesSchema,
			alpha: keyframesSchema,
			beta: keyframesSchema,
			gamma: keyframesSchema,
			delta: keyframesSchema,
			epsilon: keyframesSchema
		};
	}

	static get behaviorName(): string {
		return 'interpolate';
	}

	static get dependencies(): Array<string> {
		return ['^guidelayout', 'layout'];
	}

	attach() {
		this._interpolators = {};

		//Non-zero defaults.
		this._defaultValues = {
			opacity: 1,
			scale: 1
		};

		this.values = {};

		//TODO: what if interpolate behaviopr is added lazy? We don't get an initial event then.
		//Maybe ask the element nicely for a cached value of the last time it fired, if any?

		//LAYOUT IS ASYNC, not immediately when attached.
		this.listen(this.parentEl, 'guidelayout:layout', () => {
			this._createInterpolators();
		});

		this.listen(this.parentEl, 'guidelayout:scroll', e => {
			this._interpolate(e.detail.scrollState);
		});
	}

	update() {
		this._createInterpolators();
	}

	_createInterpolators() {
		let schema = this.constructor.schema;

		for (let prop in schema) {
			if (schema.hasOwnProperty(prop)) {
				if (this.props[prop].length > 0) {
					this._interpolators[prop] = this._createInterpolator(this.props[prop]);
				} else {
					delete this._interpolators[prop];
				}
			}
		}

		//Apply the interpolators right away.
		this._interpolate(this.parentEl.guidelayout.scrollState);
	}

	_createInterpolator(keyframes: Array<Keyframe>) {
		let layoutEngine = this.parentEl.guidelayout.engine;

		//Map the keyframe anchor and offset to scroll positions.
		let mappedKeyframes = keyframes.map(keyframe => {
			let pixelOffset = layoutEngine.lengthToPixel(keyframe.offset, this.el.layout.layout.height);
			let position = layoutEngine.calculateAnchorPosition(this.el.layout, keyframe.anchor, pixelOffset);

			return {
				position: position,
				value: keyframe.value
			};
		});

		//Sort them by scroll position from top to bottom.
		mappedKeyframes = mappedKeyframes.sort((a, b) => a.position - b.position);

		let firstKeyframe = mappedKeyframes[0];
		let lastKeyframe = mappedKeyframes[mappedKeyframes.length - 1];

		//Return a function which, given the current scrollPosition, returns the interpolated value.
		return function(scrollPosition: number): number {
			//If the top position is out of bounds, use the edge values.
			if (scrollPosition <= firstKeyframe.position) {
				return firstKeyframe.value;
			}

			if (scrollPosition >= lastKeyframe.position) {
				return lastKeyframe.value;
			}

			//Figure out between which two keyframes we are.
			for (let i = 1; i < mappedKeyframes.length; i++) {
				let rightKeyframe = mappedKeyframes[i];

				//We found the right keyframe!
				if (scrollPosition < rightKeyframe.position) {
					let leftKeyframe = mappedKeyframes[i - 1];

					let progress = (rightKeyframe.position - scrollPosition) / (rightKeyframe.position - leftKeyframe.position);

					return progress * (leftKeyframe.value - rightKeyframe.value) + rightKeyframe.value;
				}
			}

			throw new Error('Could not interpolate');
		};
	}

	_interpolate(scrollState: ScrollState) {
		let schema = this.constructor.schema;
		let didChange = false;

		for (let prop in schema) {
			if (schema.hasOwnProperty(prop)) {
				let previousValue = this.values[prop];

				if (this._interpolators.hasOwnProperty(prop)) {
					this.values[prop] = this._interpolators[prop](scrollState.position);
				} else {
					this.values[prop] = this._defaultValues.hasOwnProperty(prop) ? this._defaultValues[prop] : 0;
				}

				if (previousValue !== this.values[prop]) {
					didChange = true;
				}
			}
		}

		if (didChange) {
			this.emit('change');
		}
	}
}
