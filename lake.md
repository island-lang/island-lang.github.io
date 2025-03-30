<h1 id="top-heading">The Lake Programming Language</h1>
<h2 id="top-subheading-2">(Work In Progress)</h2>

**Lake** (backronym: **La**nguage for **k**ompon**e**nts) is a declarative programming language designed as a component language suitable for a wide variety of application domains.

Lake was designed to ensure **approachability** for non-professional programmers and people in other fields, like designers, artists, and scientists. Programs are built via compositions of concrete, rather than abstract, building blocks. There are no complex inheritance hierarchies or polymorphic relationships. Instead, computations are carried out mainly by constructing cascades of dependent objects, or sequences of such objects, and then extracting the needed data by simply naming and exposing it.

Informally, a Lake program produces a **domain-specific object model** (a more general form of the Document Object Model used in web development), that by itself, is not a real "program" and does not produce any effects.

This event-driven, DOM-like, set of dynamic objects, is then interpreted by the host to produce a working program by binding and materializing its objects, states, and events to actual outputs and behaviors of the host, like UI elements, shapes drawn on a canvas, letters written on the screen, etc.

Every Lake source file represents a single component consisting of a set of named variables. A component's state is specified by a set of one or more free variables, called _inputs_. All of its other variables are either dependent or constant.

From the perspective of the host, a Lake component is seen as a **JSON-like** object model. The component's internal computations are performed behind the scenes, transparently, and updated lazily, when needed.

Lake is a **reactive** language. A change to a variable is propagated to all its dependencies and may cause them to be recomputed. The host may subscribe to notifications for some, or all, modification events.

Lake supports **interaction modeling** via events and actions. Actions may alter input values in response to events, or trigger secondary events. Events and actions can also be set to initiate whenever a particular set of preconditions are met within the component, using a special language feature called a _responsive observer_.

Every Lake component, as well as each of its variables, may embed **native metadata** properties. Metadata can be used to integrate components as interactable elements within a visual design environment.

More advanced features include functions, templates, mixins, sequence generators, programmable units of measure, custom types, and more.

[toc]

# Language design

## Principles and constraints
* **Static typing**: all data types are resolved at compile-time.
* **Non-nullability**: all placeholders are guaranteed to receive a value. It is not possible to have a value that is 'null' or 'undefined' unless it was explicitly enabled in its type definition.
* **Independence**: each component is self-contained and fully described by its inputs.
* **Determinism**: given the same input set, a component will always evaluate to the same exact set of properties (_pseudo-randomness is supported via specialized syntax, requiring explicit seed values to be set_).
* **No external side effects**: a component does not induce external effects or indirectly interact with the system in any way.
* **Lazy evaluation**: values are (re)computed only when needed. Computed values may be cached and subsequently reused to speed-up future evaluations of similar or related values.
* **Order insensitivity**: the meaning of a program does not depend on the order of statements.
* **No hidden state**: no aspect of a component's state is hidden.
* **No hidden state changes**: state changes must be a direct result of alterations to one or more inputs.

## Programming paradigm

Lake draws ideas from a wide variety of programming paradigms (and some non-programming ones), in particular:

* Dataflow programming
* Functional programming
* Reactive programming
* Event-driven programming
* Object-oriented programming
* Presentational languages
* Domain-specific languages
* Parametric and generative design

Lake cannot be directly classified into a specific family of existing languages. However, it is fundamentally structured around a hierarchical JSON-like object model, and the way its components work and interact has some similarities to JavaScript frameworks such as React and Svelte, though it doesn't incorporate native support for HTML or CSS, so it can't really be classified as a "true" web language.

It can be seen as a generalization of many declarative patterns that have been found useful for web programming, as well as for other domains such as user-interface design, computer graphics, and animation, game programming, typesetting, and visualization.

## Intended applications
(this is a partial list)

* UI elements and components
* 2D vector graphics
* 3D models and scenes
* Computer Aided Design (CAD)
* Procedurally generated graphics and animations
* Game programming
* Chart, plot and diagram generation
* Mathematical and scientific visualizations
* Simulations and modeling
* Typesetting and desktop publishing (PostScript / TeX alternative)
* Parametric typeface design
* Audio synthesis and filter chains
* A more advanced **JSON alternative**: an interchange format for specifying data structures which may involve light computations and modularity, such as configuration, settings and resource management files.

# Introductory guide
## Illustrative code example

```lake
// Component metadata:
meta: {
	name: "Demo"
	description: "A simple demo"
}

// Imports:
Circle: import("https://example.com/lib/Circle.lake")
Line: import("https://example.com/lib/Line.lake")
Triangle: import("https://example.com/lib/Triangle.lake")

average: import("math.js").average as (elements as decimal[]) => decimal

hslaToRgba: import("helpers.js").hslaToRgba as (hsla as Color.HSLA) => Color.RGBA
rgbaToHsla: import("helpers.js").rgbaToHsla as (hsla as Color.RGBA) => Color.HSLA

// Inputs:
input centerPoint: Point(10, 20)
centerPoint.meta: {
	name: "Center point"
	range: { start: (0, 0), end: (100, 100) }
}

input endPoint: Point(50, 40)
endPoint.meta: {
	name: "End point"
	range: { start: (0, 0), end: (100, 100) }
}

input triangleColor: Black
triangleColor.meta: {
	name: "Triangle color"
}

// Events:
event shapeClicked: {
	kind as ShapeKind
	position as Point
}

event triangleColorIsGreen

// Objects and properties:
someRectangle: Rectangle {
	center: centerPoint
	width: c1.diameter
	height: width

 	// Handles Rectangle's 'clicked' event with an action block:
	on clicked: do {
		set triangleColor to Blue

		// Triggers the component's 'shapeClicked' event:
		trigger shapeClicked with { kind: Rectangle, position: center }
	}
}

someLine: Line {
	start: centerPoint
	end: endPoint

	with blackTransparentColor(67)

	// Handles Line's 'clicked' event with an action block:
	on clicked: do {
		trigger shapeClicked with { kind: Line, position: start }
	}
}

someBezier: Bezier {
	start: centerPoint
	end: endPoint

	control1: (45, 23)
	control2: (65, 32)

	with blackTransparentColor(40)
}

someTriangle: Triangle {
	vertices: [centerPoint, (14, 1), (7, 9)]
	color: triangleColor

	// Handles Triangle's 'clicked' event:
	on clicked: do {
		// Sets triangleColor input to red:
		set triangleColor to Red

		// Animates centerPoint's x coordinate, depending on its initial position:
		when centerPoint.x >= 400 {
			transition centerPoint.x to centerPoint.x + 50 using {
				duration: 0.4
				interpolation: EaseInOut(0.1)
			}
		}
		otherwise {
			transition centerPoint.x to centerPoint.x - 50 using {
				duration: 0.4
				interpolation: EaseInOut(0.1)
			}
		}

		trigger shapeClicked with { kind: Triangle, position: centerPoint }
	}
}

someLines: Line[] [ // Defines a sequence of 2 Line objects
	{
		start: (0, 0)
		end: (5, 0)
	},
	{
		start: (5, 0)
		end: (5, 5)
	}
]

otherLines: Line[k in 0..6] { // Algorithmically generates an array of 6 Line objects
	start: (0, k * 3)
	end: (k * 3, 10)
}

// Responsive observer
whenever triangleColor == Green: do {
	trigger triangleColorIsGreen
}

// Functions
function square(x as decimal): x * x

// Templates:
template NiceCircle: Circle {
	center: centerPoint
	radius as decimal
}

template UnitCircle(center as Point): Circle {
	center
	final radius: 1.0
}

// Mixins:
mixin blackTransparentColor(a as integer): {
	color: Black

	opacity: compute {
		when a > 5: 50%
		when a < 5: 30%
		otherwise: 15%
	}
}

// Custom units:
unit cm(m): 0.01 * m
unit m(cm): 100.0 * cm
unit `%`(cm): cm / totalWidth
unit decimal(cm): cm

// Custom types:
type Point: (x as decimal, y as decimal)

variant ShapeKind: {
	Rectangle
	Line
	Triangle
}

variant Color: {
	RGBA(r as integer, g as integer, b as integer, a as integer)
	RGBA(hsla as HSLA): hslaToRgba(hsla)

	RGB(r as integer, g as integer, b as integer): RGBA(r, g, b, 255)

	HSLA(h as decimal, s as decimal, l as decimal, a as decimal)
	HSLA(rgba as RGBA): rgbaToHSLA(rgba)

	HSL(h as decimal, s as decimal, l as decimal): HSLA(h, s, l, 1.0)

	Black: RGB(0, 0, 0)
	White: RGB(255, 255, 255)
	Red: RGB(255, 0, 0)
	Green: RGB(0, 255, 0)
	Blue: RGB(0, 0, 255)
}
```

## Every source file is a single component

A component is defined by its set of inputs (free variables) and properties (dependent variables or constants), as well as miscellaneous other elements like functions, templates, events, mixins, and others.

## A source file is composed of a set of declarations

Declarations introduce new identifiers, and may have values of primitive (`integer`, `decimal`, `string`, `boolean` etc.), array, object, or more advanced types:
```lake
numberValue: 45
stringValue: "Hello"
booleanValue: true
arrayValue: [1, 2, 3]
```

Like in JSON, Objects are declared in curly braces, and may nest other objects:
```lake
objectProperty: {
	numberProperty: 55
	stringProperty: "World"

	nestedObjectProperty: {
		deepNestedProperty: true
	}
}
```

## Inputs are free variables that are used to customize and control the component

Inputs are the only kinds of variables whose values can change. They can be reassigned by the host application, or within special action blocks (actions are introduced in a later chapter).

Inputs must receive default values:
```lake
input someInput: 100
```

To state the type of the input, use the `as` operator:
```lake
input someInput as integer: 100
```

Inputs can also be designed to accept empty values (called `none` in Lake, `null` in JavaScript). However, since Lake types are not nullable by default, this has to be stated explicitly, as part of the type:

```lake
input someInput as integer or none: none
```

Same can be expressed using the `type?` abbreviation:
```lake
input someInput as integer?: none
```

## Properties are dependent variables that can be computed using other variables

A property is bound to an expression (aka a "formula") via the `:` operator. The expression may refer to any identifier in scope (declaration order does not matter):

```lake
input someInput: 100

componentProperty: {
	numberProperty: 20
	computedProperty: someInput / numberProperty // initially evaluates to 5
}
```

## Property expressions may include conditionals

To define a conditional as a part of an expression, this syntax can be used:
```lake
conditionalValue: when someInput >= 0: 1.0, when someInput == 0: 0, otherwise: -1.0
```
The `when`-`otherwise` syntax is similar to `if`-`else if`-`else` syntax in other languages, only simpler. In this syntax, all the non-final clauses are stated using `when` and the final one using `otherwise`. Because Lake doesn't support null (empty) values, an `otherwise` clause is always required.

In each clause body, the arrow (`=>`) signifies the "output" of the `when` expression. As you'll see in the next chapters, in Lake, many kinds of expressions can be seen as having inputs and outputs, just like methods, so the `=>` here has a lot in common with the value returned from a function.


A second variant of the syntax may also introduce a `compute` (or "formula") block, which allows laying out the computation over multiple statements. This is equivalent:
```lake
conditionalValue: compute {
	when someInput >= 0: 1.0 // Commas are not necessary
	when someInput == 0: 0
	otherwise: -1.0
}
```

When multiple properties include similar conditionals, like in:

```lake
someObject: {
	prop1: when someInput >= 0: 1.0, when someInput == 0: 0.0, otherwise: -1.0
	prop2: when someInput >= 0: "good!", when someInput == 0: "ahh..", otherwise: "bad!"
}
```

They can be refactored by defining both properties together using a single formula block that returns a tuple for the values of both:
```lake
someObject: {
	prop1, prop2: compute {
		when someInput >= 0: 1.0, "good!"
		when someInput == 0: 0.0, "ahh.."
		otherwise: -1.0, "bad!"
	}
}
```

## Prototype references allow objects to build on top of other objects

Object declarations may specify a **prototype**:
```lake
elementName: PrototypeName {
	.... // inputs or properties to set
}
```
A prototype reference may either be a:

* Component
* Template
* Secondary object

which would serve as a basis for the newly declared object.

### Objects deriving from a prototype may be anonymous

When a prototype reference is included, the identifier may be omitted, resulting in an **anonymous object**:
```lake
PrototypeName {
	....
}
```
Anonymous objects are useful as presentational elements and are loosely analogous to XML elements with no `id` attribute specified.

Anonymous objects must specify a prototype - an object cannot be both anonymous and lack a prototype.

## Templates are objects with unset properties, which can only be used as prototypes

```lake
template MyTemplate: {
	prop1: 5
	prop2: 5 * 2
	prop3 as decimal // This property is unset and must be overriden
}
```

`MyTemplate` can now be used as a basis to a new object:
```lake
newObject: MyTemplate {
	prop3: -12 // A value for prop3 is required
}
```

### Templates may accept arguments:
```lake
template TemplateWithArgument(x as decimal): {
	prop1: x
	prop2: x * 2
	prop3 as decimal
}
```

`TemplateWithArgument` requires an argument when used:
```lake
newObject: TemplateWithArgument(55) {
	prop3: -12
}
```

## Functions perform computations based on a set of arguments

Here's a function that computes a simple value:
```lake
function absoluteValue(x as decimal): when x >= 0: x, otherwise: -x
```

The function body can also be written in a block:
```lake
function absoluteValue(x as decimal) { // ': compute' is not required
	when x >= 0: x
	otherwise: -x
}
```

To explicitly specify the return type of the function, add the type annotation before the opening brace:
```lake
function absoluteValue(x as decimal) as decimal {
	when x >= 0: x
	otherwise: -x
}
```

### Function parameters may be optional and have default values

Default parameter values are stated using the universal definition syntax `indentifier: defaultValue`:
```lake
function someFunction(a as integer, b as string, c: 42) {
	....
}
```

Optional parameters must have default values. The language doesn't support implicit "null" values. However, the `none` type can be accepted by using a choice type like `decimal or none`, which can also be abbreviated as `decimal?` (choice types are introduced in a later chapter).

To explicitly state the type of function parameter defined using a default value, use the `as` operator over the parameter name:
```lake
function someFunction(a as integer, b as string, c as integer: 42) {
	....
}
```

### Function arguments can be named

When calling a function, arguments can be passed out-of-order by referencing their names:

```lake
result: someFunction(53, c: "world", b: "hello")
```

### Functions can recursively call themselves

Here are some examples of recursive functions.

The following function computes the sum of a sequence, by calling itself when the sequence is not empty, with the subsequence starting at the second element, and with the first element of the sequence added to its named return variable (`sum`). In this way, it eventually computes the sum of the sequence:
```lake
function sumSequence(numbers as decimal[]) as (sum: 0) {
	when numbers.length == 0: sum
	otherwise: sumSequence(numbers: numbers[2..], sum: sum + numbers[1])
}
```

This function computes the nth Fibonacci number by iteratively calling itself, passing the updated intermediate state to the next iteration at each step, until it reaches the stopping condition of `i >= n`.

```lake
function fibonacci(n as 1..infinity, i: 3, prev1: 1, prev2: 1) as (result: 1) {
	when i >= n: result
	otherwise: fibonacci with { // This is an alternative syntax for fibonacci(....)
		i: i + 1
		prev1: result
		prev2: prev1
		result: prev1 + prev2
	}
}
```

Here's another example, which uses two local recursive operations to implement the QuickSort algorithm:

```lake
function quicksort(nums: decimal[]) as decimal[] {
	when items.length == 0: []
	otherwise: compute {
		local pivot: nums[nums.length div 2]

		local sortedSmallerNumbers: quicksort(select all num in nums where num < pivot)
		local sortedGreaterOrEqualNumbers: quicksort(select all num in nums where num >= pivot)

		sortedSmallerNumbers | sortedGreaterOrEqualNumbers
	}
}
```


## Formulas are similar to functions, but also allow references to outer variables

Formulas are a reusable form of the `compute` blocks used in property declarations.

A formula can do anything a function does, but in addition, its output can also use depend on the current state of the component:

```lake
input someInput: 100

formula someFormula(x as integer): x + someInput
```

## Mixins help reduce code redundancy

**Mixins** are reusable object fragments that may be embedded within object bodies:

Here's an example of a mixin
```lake
mixin blueAndPartiallyTransparent: {
	color: Blue
	opacity: 0.5
}

Circle {
	center: (40.0, 40.0)
	radius: 4.5

	with blueAndPartiallyTransparent
}

Rectangle {
	top: 100.0
	left: 120.0

	with blueAndPartiallyTransparent
}
```

### Mixins may accept arguments
We can change the previous example so that the mixin would have its opacity given via a parameter:
```lake
mixin blueWithOpacity(opacityValue as decimal): {
	color: Blue
	opacity: opacityValue
}

Circle {
	center: (40.0, 40.0)
	radius: 4.5

	with blueWithOpacity(0.5)
}

Rectangle {
	top: 100.0
	left: 120.0

	with blueWithOpacity(0.7)
}
```

## Events and actions model interaction and state changes

Events are special methods that are used for passing messages to the host application or in-between components.

`Button.lake`:

```lake
event clicked: {
	mousePosition as Point
	buttonIndex as integer
}
```

Events can be handled via special code blocks called **actions**.

Actions may include one or more input reassignments. The reassigned inputs can belong to any ancestor component in scope, including the top-level component. In this example, the `color` input of `someButton` is reassigned:

`MyComponent.lake`:
```lake
someButton: Button {
	width: 100
	height: 20
	color: Blue

	// 'on clicked' handler is called when the 'clicked' event is triggered:
	on clicked: do {
		when event.buttonIndex == 0 { // The 'event' keyword refers to handled event data object
			set color to Red
		}
		otherwise {
			set color to Blue
		}
	}
}
```

### Actions may trigger secondary events

Here a secondary event `someButtonClicked` is triggered whenever `Button.clicked` is triggered:
```lake
event someButtonClicked: {
	buttonIndex as integer
}

someButton: Button {
	width: 100
	height: 20
	color: Blue

	on clicked: do {
		set color to Red

		// This would trigger the 'someButtonClicked' event:
		trigger someButtonClicked with { buttonIndex: event.buttonIndex }
	}
}
```

### Top-level handlers can listen to the component's own events
Handlers can also be defined at the top-level, for the component's own events. In this example, clicking either the triangle or rectangle would cause the component's `shapeClicked` event to be triggered. A top-level event handler, would then cause the color of both shapes to change to blue:

```lake
input shapeColor: Black

event shapeClicked

on shapeClicked: do {
	set shapeColor to Blue
}

Triangle {
	color: shapeColor

	on clicked: trigger shapeClicked
}

Rectangle {
	color: shapeColor

	on clicked: trigger shapeClicked
}
```


### Actions can be declared as reusable methods

and accept arguments:

```lake
input buttonColor: Black

action changeButtonColorTo(newColor as Color) {
	set buttonColor to newColor
}

someButton: Button {
	color: buttonColor

	on clicked:	changeButtonColorTo(Red)
}
```

Action methods may also be called from within action blocks (or other action methods):

```lake
input buttonColor: Black
input buttonWidth: 10

action changeButtonColorTo(newColor as Color) {
	set buttonColor to newColor
}

action changeButtonWidthTo(newWidth as decimal) {
	set buttonWidth to newWidth
}

someButton: Button {
	color: buttonColor

	on clicked: do {
		changeButtonColorTo(Red)
		changeButtonWidthTo(20)
	}
}
```

### Event handlers may include preconditions

Preconditions can be added to `on` handler syntax using the `when` keyword:

```lake
someButton: Button {
	color: buttonColor

	on clicked when event.mouseButton == MouseButton.Left: do {
		changeButtonColorTo(Red)
	}

	on clicked when event.mouseButton == MouseButton.Right: do {
		changeButtonColorTo(Blue)
	}
}
```

## Responsive observers automatically initiate actions when a precondition is met

A responsive observer is a persistent listener that continuously monitors for a particular precondition to hold. At each state change that potentially affects the truth value of its precondition, it checks if the precondition has become satisfied. If the precondition evaluates to `true`, it performs an action, which may also trigger one or more events:

```lake
input triangleColor: Red

event triangleColorIsGreen

whenever triangleColor == Green: do {
	trigger triangleColorIsGreen
}
```

The `whenever` keyword is followed by a boolean expression, that defines the precondition, followed by a `do` block or action method call.

After the action is executed, the program would wait for the precondition to evaluate back to `false` again. At that point, the listener would be reset, and would trigger again if its precondition evaluates back to `true`.

### Responsive observers can also be declared locally, inside object blocks

```lake
mySlider: Slider {
	value: 0
	color: Red

	whenever value >= 50: do {
		set triangleColor to Blue
	}

	whenever value < 50: do {
		set triangleColor to Red
	}
}
```

### Be careful: responsive observers may produce feedback loops

Here are two responsive observers that would cause an infinite feedback loop, that would cause the program to hang:
```lake
whenever triangleColor == Red: do {
	set triangleColor to Blue
}

whenever triangleColor == Blue: do {
	set triangleColor to Red
}
```

You'll need to ensure that the precondition does not depend on inputs that are modified as a result of the action that it initiates, otherwise you may run the risk of infinite loops of this sort. The compiler will try to help by detecting obvious cases of circular dependencies of this kind, but it may not be able to identify all cases.


## Time-based interpolation of inputs

Lake includes native support for "animating" an input, or one of its properties, over time:

```lake
Circle {
	center: (0, 0)
	radius: 10

	on clicked: do {
		transition radius to radius * 2 using { duration: 1.0, interpolation: easeInOut }
	}
}
```

Clicking the circle would start an animation-like update sequence that would gradually increase the `radius` input of the circle until it reaches double its original value. The `duration` option sets the total time of the process to 1.0 seconds. The `interpolation` option accepts a function that computes the intermediate values of the target value over time. In this example, it uses a function called `EaseInOut` which uses a Bézier curve to interpolate the value while accelerating at the start and decelerating at the end.

### Running several transitions in sequence

By default, launching a `transition` will return immediately, without waiting for the transition to finish. This is important to ensure the program would still be responsive even when a transition is actively running. To run several transitions in sequence, use the `spawn` keyword instead of `do`, and set the `wait` property to `true` for each `transition`'s options object:

```lake
Circle {
	center: (0, 0)
	radius: 10
	color: Black

	on clicked: spawn {
		transition radius to radius * 2 using {
			duration: 1.0
			interpolation: EaseInOut
			wait: true
		}

		transition center.x to center.x + 100 using {
			duration: 0.5
			interpolation: Linear
			wait: true
		}
	}
}
```
This launches a sequence of synchronous `transition` operations that run in the background and don't block the program.

### Launching a complex combination of sequential and parallel transitions

For more complex scenarios, you can use the `spawn` keyword to launch several execution threads that will be run in parallel. In this example, one thread transitions the `radius` input of `Circle`, and the other its `center` input:

```lake
Circle {
	center: (0, 0)
	radius: 10
	color: Black

	on clicked: do {
		spawn {
			transition radius to radius * 2 using {
				duration: 1.0
				interpolation: EaseInOut
				wait: true
			}

			set color to Blue
		}

		spawn {
			transition center.x to center.x + 100 using {
				duration: 0.5
				interpolation: Linear
				wait: true
			}

			transition center.y to center.y + 100 using {
				duration: 0.5
				interpolation: Linear
				wait: true
			}

			set color to Red
		}
	}
}
```

Note that initiating several such sequences in parallel may lead to unexpected results, where inputs may be reassigned in unintended orders, and it may become difficult to keep track of the component's state. It is important to be careful not to overuse this feature and try to minimize complexity of this kind.

### Using a custom interpolation function

Since any interpolation function can be used, time-based interpolation is not only limited to simple numeric values. It can be applied to more complex types like tuples, sequences, strings, or even arbitrary objects!

The interpolation function is a simple function that accepts a start value, an end value, and a number between 0.0 and 1.0 that represents the current relative position in the timeline.

Here's an example of a linear interpolation function that can be passed as an argument to `transition` `interpolation` option:
```lake
function linearInterpolation(start as decimal, end as decimal, position as 0.0..1.0):
	start + (end - start) * position

on clicked: do {
	...
	transition length to length * 3 using { duration: 1.0, interpolation: linearInterpolation }
}
```

This example linearly interpolates the elements of a pair, represented as a tuple:

```lake
type Location: (x as decimal, y as decimal)

function locationInterpolation(start as Location, end as Location, position as 0.0..1.0):
	(linearInterpolation(start.x, end.x, position), linearInterpolation(start.y, end.y, position))

input location: Location

on clicked: do {
	...
	transition location to (location.x + 10, location.y + 10) using {
		duration: 1.0
		interpolation: locationInterpolation
	}
}
```

### Update rate

The update rate (frame rate) of the transition is a controlled by the host, and may be dynamically increased or decreased based on user settings or factors like CPU load, process priority, etc.

## Locals help to represent intermediate computations

Locals are definitions that may be introduced nearly anywhere in the code, including within object bodies, templates, functions, actions and mixins.

Locals cannot be referenced from outside their own scope and do not become a part of the object hierarchy.

Almost all declarations can be made locally. This includes local properties, functions, formulas, templates, mixins, action methods and types aliases.

Local declarations must be prefixed by the `local` keyword. The prefix is required to ensure programs making use of locals would be easy to read and understand.

### Properties can be local
In this example, a local property (`sum`) is declared from within a function body:
```lake
function averageOf2(a as decimal, b as decimal) {
	local sum: a + b

	sum / 2
}
```

### Functions and formulas can be local

In this example, a local function is defined within an event handler's body:
```lake
input num1: 1
input num2: 10

Button {
	on clicked: do {
		local function triple(n as integer): n * 3

		set num1 to triple(num1)
		set num2 to triple(num2)
	}
}
```

### Templates can be local

### Mixins can be local

In this example, a local mixin is defined within an object definition:
```lake
Panel {
	local mixin blackTextColor: {
		textColor: Black
	}

	buttons: Button[] [
		{
			text: "Click this"
			with blackTextColor
		},
		{
			text: "Don't click this"
			with blackTextColor
		}
	]
}
```

### Action methods can be local

Here, a local action method is defined within an object definition:
```lake
someButton: Button {
	color: Black

	local action changeButtonColorTo(newColor as Color) {
		set color to newColor
	}

	on clicked:	changeButtonColorTo(Red)
	on dragged: changeButtonColorTo(Blue)
}
```

### Type aliases can be local

Here, a local type is defined within an object definition:
```lake
someObject {
	local type MyType: integer[3]

	someProp: MyType [4, 5, 6]
}
```

## Sequences

A Lake sequence represents a succession of values, and is similar to lists in other languages.

A sequence is written like a JSON-style array:
```lake
numberSequence: [1, 2, 3, 4]

objectSequence: [
	{
		prop1: 65.0
		prop2: true
	},
	{
		prop1: -12.5
		prop2: false
	}
]
```

### Sequence elements may be typed with a prototype
Appending `[]` to the prototype indicates a sequence of elements of that type:
```lake
mySequence: Circle[] [
	{
		radius: 1.0
		center: (3, 2)
	},
	{
		radius: 2.0
		center: (5, 7)
	}
]
```

### Sequence indices can receive custom ranges
If you wish to ensure that the number of elements is some exact constant, you can also specify it explicitly. For example:
```lake
fiveNumbers: integer[5] [7, 3, 5, 2, 4]
```
To specify a starting index other than `1` (the default), a range can be used:
```lake
fiveNumbers: integer[10..15] [7, 3, 5, 2, 4]
```
Negative indices are also valid:
```lake
fiveNumbers: integer[-2..2] [7, 3, 5, 2, 4]
```

### Sequences can be generated by iterating over other sequences
using the **`foreach`-`in`** syntax:

```lake
names: ["Tina", "Dan", "Julia"]

newNames: foreach name in names: "Hello {name}!"
```
`newNames` would evaluate to `["Hello Tina!", "Hello Dan!", "Hello Julia!"]`.

For a more complex expression, a formula block can be used:
```lake
names: ["Tina", "Dan", "Julia"]

newNames: foreach name in names: compute {
	when name == "Dan": "Hey Dan!"
	otherwise: "{name}?"
}
```
`newNames` would evaluate to `["Tina?", "Hey Dan!", "Julia?"]`.

### `foreach`-`in` iteration may filter elements

using the `where` clause:
```lake
names: ["Tina", "Dan", "Julia"]

newNames: foreach name in names where name != "Dan": "{name}!"
```

`newNames` would evaluate to `["Tina!", "Julia!"]`.

_(note that referencing the index of an element of a computed sequence involving a `where` clause, e.g. `newNames[2]`, may require the condition to be evaluated for all indices prior to the target one, so the operation may become linear-time, instead of constant-time)_

### `foreach`-`in` may be applied to multiple sequences simultaneously

by separating multiple `x in sequence` clauses with a comma:
```lake
names: ["Tina", "Dan", "Julia"]
ages: [23, 20, 33, 19]

newNames: foreach name in names, age in ages: {
	theName: name
	theAge: age
}
```

Both sequences would be iterated at the same time, that is, at first `name[1]` and `age[1]`, then `name[2]` and `age[2]`, and so on. If the two sequences have different lengths, iteration would stop when the first of them ends.

`newNames` would evaluate to:
```lake
[
	{ theName: "Tina", theAge: 23 }
	{ theName: "Dan", theAge: 20 }
	{ theName: "Julia", theAge: 33 }
]
```

### `foreach`-`in` may be nested

Nesting `foreach` expressions would generate a sequence of sequences that enumerate all permutations of sequence elements:
```lake
names: ["Tina", "Dan", "Julia"]
associateNames: ["Maya", "Andy"]

pairings: compute {
	foreach employeeName in names: {
		foreach associateName in associateNames: {
			name: employeeName
			associate: associateName
		}
	}
}
```

`pairings` would evaluate to
```lake
[
	[{ name: "Tina", associate: "Maya" }, { name: "Tina", associate: "Andy" }]
	[{ name: "Dan", associate: "Maya" }, { name: "Dan", associate: "Andy" }]
	[{ name: "Julia", associate: "Maya" }, { name: "Julia", associate: "Andy" }]
]
```
To flatten these to a single dimensional sequence, use the `flattened` property:
```lake
flattenedPairings: pairings.flattened
```
which results in:
```lake
[
	{ name: "Tina", associate: "Maya" }
	{ name: "Tina", associate: "Andy" }
	{ name: "Dan", associate: "Maya" }
	{ name: "Dan", associate: "Andy" }
	{ name: "Julia", associate: "Maya" }
	{ name: "Julia", associate: "Andy" }
]
```

### When only filtering is desired, use `select all`

Instead of:
```lake
onlyPositiveNums: foreach num in nums where num >= 0: num
```
You can write:
```lake
onlyPositiveNums: select all num in nums where num >= 0
```

### To retrieve only the first match, use `select first`

```lake
nums: [-4, -5, 7, 1]
firstPositiveNum: select first num in nums where num >= 0
```
`firstPositiveNum` gets the value `7`

(if no match was found, the value would be `none`).

To retrieve the index of the first match, use the `.range` property:

```lake
firstPositiveNumIndex: select first i in nums.range where nums[i] >= 0
```
`firstPositiveNumIndex` gets the value `3`

## Sequences can be generated algorithmically
This would generate a sequence of `Circle` objects of size `circleCount` where each circle of index `k` has center `(3 * k, 2 * k)`:
```lake
mySequence as Circle[k in 1..circleCount]: {
	radius: 1.0
	center: (3 * k, 2 * k)
}
```

### Computed sequences may be infinite
Lake is [lazily evaluated](https://en.wikipedia.org/wiki/Lazy_evaluation). This means that values are computed only when they are truly needed.

For this reason, sequences can also be defined over infinite ranges. This would generate the sequence of all positive even numbers:
```lake
evenNumbers as integer[k in 1..infinity]: k * 2
```

The way this works is that the sequence acts as if it were a function, where `k` (the index) acts as an argument, and the evaluated expression acts as the return value. For instance, to retrieve the 100000 element of `evenNumbers` (`evenNumbers[100000]`), the expression is evaluated immediately to `k * 2`, that is, `100000 * 2 = 200000`.

### Computed sequences may be defined by induction
Computed sequence elements may include references to prior elements of the sequence:
```lake
fibonacciNumbers as integer[k in 1..infinity]: compute {
	when k == 1 or k == 2: 1
	otherwise: fibonacciNumbers[k-2] + fibonacciNumbers[k-1]
}
```
(_note that prior elements can only be referenced with the form `identifier[k-c]`, where `c` is a constant and `k-c` is provably a valid index. Using a more complex expression would cause a compilation error_)

This kind of computed sequence is called an **inductive sequence**. The above code generates the full series of Fibonacci numbers using an approach resembling _[mathematical induction](https://en.wikipedia.org/wiki/Mathematical_induction)_.

Reading an inductive sequence at position `k` may require all of its prior elements to be (re)computed. Random lookups of this kind may become computationally expensive.

However, if the sequence is read sequentially, say, for the above example, over an index range between `10` to `20`, the compiler may optimize the calls by caching the value of a few recent indices. For instance, when `fibonacciNumbers[20]` is read, it may reuse previously computed values for `fibonacciNumbers[19]` and `fibonacciNumbers[18]` and in this way compute individual indices in constant time.

### An inductive sequence can help to implement an accumulator function

For instance, here's a function that sums a sequence of integers:
```lake
function sumNumbers(nums as integer[]) as integer {
	// Defines a local inductive sequence representing the cumulative sum of nums:
	local sums as integer[k in nums.range]: compute {
		when k == nums.start: nums.first
		otherwise: sums[k-1] + nums[k]
	}

	when nums.length == 0: 0
	otherwise: sums.last // The resulting value is the last element of the sums sequence
}
```

### Inductive sequences cannot be emulated using `foreach`-`in`

At first glance,
```lake
s: foreach k in 1..infinity: {
	....
}
```

may seem similar to:
```lake
s as integer[k in 1..infinity]: compute {
	....
}
```

However, using `foreach`-`in` in this way wouldn't allow references to the target sequence (`s` in this example), so inductive sequences wouldn't be possible:
```lake
s: foreach k in 1..infinity: {
	when k == 1: 1
	otherwise: s[k-1] * 3 // This won't compile! `s` cannot be referenced here!
}
```

### Inductive sequence ≠ recursion

Iteration of this kind is different from recursion, since unlike a recursion:
* It is guaranteed to terminate within a finite number of steps.
* It is computed in ascending order of indices, and always starts at the first element.
* Each element is guaranteed to require constant amount of memory to compute (not proportional to its index). A similar property is also exhibited by a subset of recursions called "tail" recursions.
* Evaluation does not involve any _transient_ intermediate state - there are no additional "phantom" iterations used to compute each element (like a local loop or recursion). All intermediate state required to compute element `k` is contained within its prior elements.

## Ranges are sequences, too

So far we've used expressions like `1..100` or `0..infinity`, but haven't really explained what they are, on a technical level. These ranges are actually sequences, and can be used by themselves in various ways.

These are valid definitions:
```lake
seq1: 200..205 // Generates the sequence [200, 201, 202, 203, 204, 205]
seq2: -50..5000 // Generates the sequence [-50, -49, ..., 5000]
seq3: -1000..infinity // Generates the infinite sequence [-1000, -999, ...]
```

Ranges can be used as part of functions as well:
```lake
function allPositiveIntegersTo(k as integer): 1..k // Generates [1, 2, ..., k]
function allIntegersBetween(s as integer, e as integer): s..e // Generates [s, s + 1, ..., e]
```

## Boolean-typed properties and functions describe the truth-values of expressions

For instance:
```lake
num: 10

booleanProp: num >= 0 // evaluates to `true`
```
and the function:
```lake
function positive(val as integer): val >= 0

isItPositive: positive(-11) // returns `false`
```

### A single parameter boolean typed function can also be evaluated with the `is` operator

Given:
```lake
function positive(val as integer): val >= 0
```
Instead of calling like:
```lake
someValueIsPositive: positive(someValue)
```
You can also write:
```lake
someValueIsPositive: someValue is positive
```

### `forall`-`in` evaluates a Boolean expression over each element of a sequence

```lake
nums: [5, 3, 1, 4]

allNumsAreGreaterThanZero: forall num in nums: num >= 0
```

`forall`-`in` is different from `foreach`-`in`: Instead of building a sequence from elements of another sequence, we are applying a predicate over the elements of the sequence and returning `true` if the predicate holds for all elements and `false` if it doesn't.

The `|` operator can be read as "it holds that", for example, in natural language, the above `forall`-`in` expression means:
```
for all num in nums, it holds that num is greater or equal to zero
```

Same written as a function, where `nums` is passed as an argument:
```lake
function allElementsAreGreaterThanZero(nums as integer[]) as boolean:
	forall num in nums: num >= 0
```

### Like `foreach`, `forall` may also include a `where` clause
```lake
function even(val as integer): num mod 2 == 0

nums: [-5, 6, -1, 4]

allPositiveElementsAreEven: forall num in nums where num >= 0: num is even
```

In natural language, this can be written as:
```
for all num in nums, if num is greater or equal to 0 then it holds that num is even
```


An equivalent way to express the same logical formula would be to apply the material implication rule:
```
P implies Q <=> (not P) or Q
```
and rewrite `allPositiveElementsAreEven` as:
```lake
allPositiveElementsAreEven: forall num in nums: num < 0 or num is even
```
Or in natural language:
```
for all num in nums, either num is less than 0, or num is even
```

### `forall` can be applied over the elements of multiple sequences

This function would evaluate to `true` when each values in the first sequence is greater than the corresponding value in the second sequence:
```lake
function correspondingElementsAreGreater(nums1 as integer[], nums2 as integer[]):
	forall num1 in nums1, num2 in nums2: num1 > num2
```

To check that _every_ element of `nums1` is greater than _every_ element of `nums2` (not just the corresponding one), use a nested `forall`:

```lake
function allElementsAreGreater(nums1 as integer[], nums2 as integer[]):
	forall num1 in nums1: {
		forall num2 in nums2: {
			num1 > num2
		}
	}
```

### `forall` can be applied over each index of a sequence
To apply `forall` over the sequence indices instead, iterate over its `.range` property.

This function would evaluate to `true` when all elements with even indices are greater or equal to zero and `false` if odd indices smaller than zero:
```lake
function evenIndicesArePositiveAndOddIndicesAreNegative(nums as integer[]):
	forall num in nums, k in nums.range: {
		when k mod 2 == 0: num >= 0
		otherwise: num < 0
	}
```

### `exists` tests the existence of at least one match
```lake
atLeastOnePositiveElementIsEven: exists num in nums where num >= 0 and num mod 2 == 0
```

To get the the first match, use `select first` instead:

```lake
firstPositiveElementThatIsEven: select first num in nums where num >= 0 and num mod 2 == 0
```

# Type system

## Built-in types
* `decimal`: a decimal number
* `integer`: an integer number
* `number`: alias for `decimal or integer`
* `string`: a sequence of characters
* `boolean`: `true` or `false`
* `binary`: a sequence of bytes
* `regexp`: a regular expression
* `none`: representing an "empty" value

## Objects

Object types are types that can contain a variety of named properties:
```lake
{
	num as integer
	strings as string[]

	obj as {
		bools as boolean[]
	}
}
```
### Updating object properties

Here's an example of updating an existing object property using the `with` operator:
```lake
input obj: { num: 11 }

on clicked: do {
	set obj to obj with { num: 12 }
}
```

This would set `obj` to a new object where the `num` property is changed from 11 to 12.

This `set` statement can also be abbreviated to:
```lake
set obj.num to 12
```

Or since `num` is incremented in this example, just:
```lake
increment obj.num
```

### Creating modified versions of existing objects

Modified and extended copies of objects can be made using the `with` operator:

```lake
obj1: { num: 1 }
obj2: obj1 with { str: "hello" }
```
`obj2` receives the value `{ num: 1, str: "hello" }`.

To specify a property to be removed in the new object, use the `no` operator:

```lake
obj1: { num1: 1, str: "hi" }
obj2: obj1 with { num1: 11, num2: 31, no str }
```
`obj2` receives the value `{ num1: 11, num2: 31 }`.

## Tuples
A tuple in an ordered sequence of values, where each value may be of a different type.

Examples:
```lake
(1, "Hi", true)
([10, 20, 30], { a: "hello", b: 42 })
```
These tuples have these types:
```lake
(integer, string, boolean)
(integer[], { a as string, b as integer })
```
Tuple type members can also be named:
```lake
(num as decimal, text as string, bool as boolean)
```

## Dictionaries
```lake
myDictionary: Dictionary {
	5: "hello"
	11: "world"
}
```

The type of `myLookup` is inferred as `Dictionary<integer, string>`.

Like objects, dictionary items can be added and removed using the `with` and `no` operators:
```lake
// Add item to dictionary
set myDictionary to myDictionary with { 3: "welcome" }

// Remove item from dictionary
set myDictionary to myDictionary with no 11

// Update exiting item in the dictionary
set myDictionary[3] to "hey"
```

## Sets
```lake
mySet: Set { "hey", "there" }
```

The type of `mySet` is inferred as `Set<string>`.

Adding and removing element from a set:

```lake
// Add element to set
set mySet to mySet with "welcome"

// Remove element from set
set mySet to mySet with no "hey"
```

Sets also support common set operations like `union`, `intersect` and `subtract`.

## Range types

Ranges like `0.0..1.0` can also be used as types, where they limit the range of values a variable can take:

```lake
function takePercentage(value as decimal, percentage: 0.0..1.0): value * percentage
```

## Choice types

A choice type (also called a "union type" or just "union") defines a type which may be one of several types.

For example:
```lake
x: integer or string
```

`x` may accept either `integer` or `string` values. To read a value of this type to a receiver of type `integer` would require a conditional:

```lake
when x is integer {
	value: x
}
otherwise { // x is string
	value: stringToInteger(x)
}
```

## Type aliases

Type aliases allow to define an identifier that "expands" to a type expression:

```lake
type IntegerOrString: integer or string
```

## Variants

A variant can be seen as a more powerful form of a choice type. It allows subtypes to be named, store a different type or amount of information, and define one or more custom constructors for each.

Variant types are defined using the `variant` keyword. In this example, `RGBA` and `HSLA` are the only direct subtypes of `Color`. All other constructors produce a type further derived from either one of them.
```lake
variant Color {
	// RGBA is a direct subtype of Color, since it doesn't specify a constructor:
	RGBA(r as integer, g as integer, b as integer, a as integer)
	RGBA(hsla: HSLA): hslaToRgba(hsla) // Secondary constructor for RGBA

	// RGB is a derived from RGBA:
	RGB(r as integer, g as integer, b as integer): RGBA(r, g, b, 255)

	// HSLA is a direct subtype of Color, since it doesn't specify a constructor:
	HSLA(h as decimal, s as decimal, l as decimal, a as decimal)
	HSLA(rgba: RGBA): rgbaToHSLA(rgba) // Secondary constructor for HSLA

	// HSL is derived from HSLA:
	HSL(h as decimal, s as decimal, l as decimal): HSLA(h, s, l, 1.0)

	// All these types derive from RGB, and thus also from RGBA:
	Black: RGB(0, 0, 0)
	White: RGB(255, 255, 255)
	Red: RGB(255, 0, 0)
	Green: RGB(0, 255, 0)
	Blue: RGB(0, 0, 255)
}
```

```lake
greenColor: Green
someCustomColor: HSL(0.2, 0.5, 0.4)
```

## Generics

Generics are type placeholders that are used to define generalized data structures or methods, that can be specialized to more specific types when they are instantiated or called.

Lake supports TypeScript-like generics.

In functions:
```lake
function createPair<T>(x as T, y as T): (x, y)
```

In templates:
```lake
template genericTemplate<T, U>: {
	prop1 as T
	prop2 as U
}
```

In mixins:
```lake
mixin genericMixin<T, U>(x as T, y as U): {
	prop1: x
	prop2: {
		val: [y, y]
	}
}
```
and similarly in formulas, action methods, variants, etc.

However, unlike TypeScript, Lake doesn't really allow creating general-purpose, efficient data structures, which are typically the main use-case for generics. For this reason (as well as the general goal of approachability and ease of use), the use of this feature is mainly intended towards built-in data structures - like dictionaries and sets, interoperability with TypeScript code, and various special cases where it is needed.


# Imports and JavaScript interoperation

## Importing components
Lake components can be imported using the `import` keyword. The reference can be a file or a URL:

```lake
Circle: import("https://example.com/lib/Circle.lake")
Line: import("https://example.com/lib/Line.lake")
Triangle: import("https://example.com/lib/Triangle.lake")
```

## Importing functions from JavaScript modules

JavaScript functions can also be imported using `import` by dereferencing the particular exported identifier name from its module path:

```lake
average: import("math.js").average
```

If the module doesn't supply a TypeScript type definition file (`.d`), the `as` keyword can be used to specify a static type for the identifier:

```lake
average: import("math.js").average as function(elements as decimal[]) => decimal
```

Without a type, the imported identifier cannot be used since Lake doesn't support dynamic typing.

# Units of measure
In Lake, every number may be followed by an arbitrary suffix like:
```lake
12.5kg
-4%
43#
```
These suffixes are called units, and may involve any alphabetic character or symbol except symbols used as operators like `+`, `-`, `*`, etc.

Fundamentally, they have no meaning. Their meaning must be stated explicitly by defining conversions:

```lake
unit kg(g): g * 1000
unit pound(oz): oz * 16
unit pound(g): 453.59237 * g
```
To define the default unit conversion for a target value with no specified units, use the `decimal` unit:
```lake
unit decimal(g): g
```
This would also mean that when a unit isn't specified, it is taken as if it was `g` (here meaning "grams").

Units are types and can be used as parameter types directly:
```lake
function someFunction(weight as kg, height as cm):
	....
```
## Units with special characters

Units with special characters can be defined by enclosing them in tilde characters:

```lake
input screenWidth: 1920

unit `%`(px): px / screenWidth
```

```lake
function someFunction(width as `%`, height as px):
	....

something: someFunction(23%, 500px)
```

## Sharing units between components

Units are valid for only for the component they are declared on. To share units between components, define them in a common file like `Units.lake` and import them on each component:

`Units.lake`:
```lake
unit kg(g): g * 1000
unit pound(oz): oz * 16
unit pound(g): 453.59237 * g
```

`SomeComponent.lake`:
```lake
Units: import("Units.lake")

unit kg: Units.kg
unit pound: Units.pound
```

# Metadata

Every Lake variable, even ones of simple types like `integer` and `boolean`, has a special `meta` object.

This object may include any property name or type:
```lake
num: 5

num.meta: {
	name: "A number"
	description: "The best number in the world!"
}
```
The properties of the `meta` object's members must be compile-time constants and cannot be modified at runtime.


# Random number generation

The language is designed to be deterministic, such that when a component is given the same set of inputs, its dependent variables would always evaluate to the same values.

Pseudo-randomness can be achieved, however, by creating a input assigned with a special built-in `random(seed)` constructor:

```lake
input randomState: random(7) // The initial state is set to 7

someRandomizedValue: randomState.decimal() // range defaults to 0.0 to 1.0

randomCircle: Circle {
	radius: randomState.decimal(10.0) // min defaults to 0.0
	center: (randomState.decimal(1.0, 3.0), randomState.decimal(1.0, 3.0))
}
```

The `random()` constructor is not a typical stateful PRNG, it is special language construct that produces a PRNG that:
* Has an underlying state that is safely and transparently incremented whenever a new pseudo-random value is generated, even if multiple generations are made in the same iteration of the event loop.
* Is not sensitive to the order in which expressions are evaluated.
* Understands sequence generation and will advance the generator's internal state at each iteration, if needed.
* Can be serialized along with the rest of the component in such a way that the restored component will continue from the same pseudo-random state.

In this way, it is ensured that given the same seed, randomly generated values are consistent across different executions.

The `randomState` object has several methods:
* `randomState.decimal(min?, max)`
* `randomState.integer(min?, max)`
* `randomState.string(length, characterSet)`
* `randomState.boolean()`
* `randomState.binary(byteCount)`

_Note that these methods are highly insecure! They should never be used to generate passwords, keys, or other sensitive information!_

# Regular expressions

Regular expressions are special expressions used to match patterns in strings.

# Closing chapter

## Open design topics

* Bundled components: multiple components bundled to one file where the embedded files are have virtual file paths.

## TODO
* Slices
* Binary literals
* Time and Date type
* Multiline strings
* `invariants` region

## Issues

## Influences

* **JSON**: syntax, object model
* **JavaScript**: some syntax
* **TypeScript**: type syntax
* **Python**, **Visual Basic**: some syntax
* **SASS**: mixins

## Feedback for this document

The repository is located at [github.com/island-lang/island-lang.github.io](https://github.com/island-lang/island-lang.github.io)

Feel free to ask questions, report errors or make constructive suggestions.

## Copyrights

Copyright © Rotem Dan<br />
2022 - 2025
