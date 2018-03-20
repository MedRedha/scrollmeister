import Scrollmeister from 'scrollmeister.js';
import LazyLoadBehavior from 'behaviors/LazyLoadBehavior.js';
import FluidTextBehavior from 'behaviors/FluidTextBehavior.js';
import ScrubBehavior from 'behaviors/ScrubBehavior.js';
import GLEffectBehavior from 'behaviors/GLEffectBehavior.js';
import InterpolateBehavior from 'behaviors/InterpolateBehavior.js';
import TransformBehavior from 'behaviors/TransformBehavior.js';

Scrollmeister.defineBehavior(InterpolateBehavior);
Scrollmeister.defineBehavior(TransformBehavior);
Scrollmeister.defineBehavior(LazyLoadBehavior);
Scrollmeister.defineBehavior(FluidTextBehavior);
Scrollmeister.defineBehavior(ScrubBehavior);
Scrollmeister.defineBehavior(GLEffectBehavior);
