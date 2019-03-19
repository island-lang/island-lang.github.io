# Island programming language

_Note this is a very early (and incomplete) design sketch and is being continuously modified. It isn't certain at this time whether the language would be eventually implemented or only used as an experimentation platform for various ideas and concepts._

**Island** (standing for **I**mmutable, **s**equentia**l**, **a**nd **n**on-**d**estructive) is a statically typed programming language aiming towards simple, approachable, imperative-style syntax and familiar object-oriented concepts while uncompromisingly maintaining full immutability and a clear separation between computations (pure functions in the mathematical sense) and actions (procedures) without requiring the use and understanding of advanced mathematical abstractions (e.g. monads).

Island introduces a number of innovative features and constructs that try to synthesize and improve on ideas from a wide range of programming languages and paradigms, ranging from academic-style purely functional languages (Haskell, Pure, Clean), hybrid languages (Scala, F#), imperative languages (C#, Java, Go) and dynamic languages (Python, JavaScript/TypeScript).

Island is not an imperative language, nor a traditional functional language. It may be seen to represent a cross (but not a hybrid) of the two paradigms, where in its deeper core it can be decomposed to and evaluated as a reasonably idiomatic purely functional execution flow.

All Island variables and objects are fully (and deeply) immutable. Once a variable or field has been initialized with a value, it cannot be changed, forever. Despite this apparent strict constraint it manages to provide the programmer with convenient syntax and abstractions, many of which were once associated exclusively with imperative programming. These include:

* Statement blocks and conditional variable assignment
* For loops: including a constrained form of iteration-scope variable reassignment, carefully designed to emulate purely functional recursion in a more convenient and flexible form.
* Generators and `for..in` loops.
* Classes and features (also known as traits), with support for inheritance.
* Closures
* Exception handling (try-catch): Errors are treated as implicit return values and thus do not degrade function purity.
* Co-routines and lightweight threads, including a constrained form of Go-like channels communication through generators (note that Island is an intrinsically thread-safe language thus does not require many thread synchronization primitives).

As well as:

* Non-nullability and flow-sensitive nullable types
* Pattern matching, including in if/case statements
* Generic and existential types in classes and functions/procedures
* Enums, with support for both numbers and strings as value types
* Partial function application: with a low-impact, novice-friendly syntax and a unique extension that allows for non-ordered parameter selection.
* List comprehensions
* Extension methods and properties
* Side-effect annotations (i.e. `func`s and `proc`s, `effect proc`s and `view proc`s)
* "Elvis" operator (nullability aware dereference chaining)
* Type aliases
* Contracts, including a basic level of static verification built into the compiler
* Flow analysis as a fundamental component of the compilation process
* Automatic memoization based on static code analysis.

## Variables

The `let` keyword is used to introduce a new variable. A variable can be typed e.g. `let a: string`, or its type be automatically inferred:

```
let a: string = "abc"
let b = 123
```

Variables can be defined in bulk:
```
let a = 1, b = 2, c = "hi"
```

Since variables can only be assigned once, there's no need for a `const` keyword. Every variable assigned with a literal is effectively a constant.

Variables can be assigned conditionally, through a deferred declaration, for example:

```
func getAverageForTripleId(tripleId: int): int
	let a, b, c

	match tripleId:
		0:
			a = 0
			b = 1
			c = 2
		1:
			a = 9
			b = 8
			c = 7
		otherwise:
			a = 5
			b = 3
			c = 4

	return (a + b + c) / 3
```

## Functions

A function statement looks like the following:
```
func fibonacci_recursive(index: int): int
	case:
		index < 2:  return index
		otherwise:  return fibonacci_recursive(index - 2) + fibonacci_recursive(index - 1)
```

Functions can be defined in different ways:
```
// Function declaration, multiple statements possible, overloading possible
func multiply2(a: int): int
	return a * 2

// Function declaration, single expression body, overloading possible
func multiply2(a: int): int => a * 2

// Lambda expression, single expression body, overloading not supported
let multiply2 = (a: int) => a * 2
```

## Pattern and case matching

* `match` statements are similar to pattern matching in some functional languages and operate over a predefined set of variables.
* `case` statements are similar to `if..else if..else` in other languages, but additionally support a form of pattern matching for lists, tuples and objects (e.g. `b ~= [_, _, let xs...]`).

```
func example1_match(a: int, b: int[]): int
	match a, b:
		-1, [_]:             return b[0:1]
		0, [_, _]:           return b[1:]
		1, [_, _, _, ...]:   return b[2:]
		otherwise:           return []

func example1_case(a: int, b: int[]): int
	case:
		a == -1 and b ~= [_]:             return b[0:1]
		a == 0  and b ~= [_, _]:          return b[1:]
		a == 1  and b ~= [_, _, _, ...]:  return b[2:]
		otherwise:                        return []

func example2_match(a: int, b: int[]): int
	match a, b:
		0, [let x]:           return x
		1, [let x, let y]:    return (x + y) / 2
		2, [_, _, let xs...]: return listAverage(xs)
		3, []:                return 100
		4, []:                return 101
		otherwise:            return 0

func example2_case(a: int, b: int[]): int
	case:
		a == 0 and b ~= [let x]:           return x
		a == 1 and b ~= [let x, let y]:    return (x + y) / 2
		a == 2 and b ~= [_, _, let xs...]: return listAverage(xs)
		a == 3 and b == []:                return 100
		a == 4 and b == []:                return 101
		otherwise:                         return 0
```

## For loops

For loops appear somewhat similar but behave a bit differently from their counterparts in traditional imperative languages.

The general header form is `for ...<loop and outer scope variable declarations>.. [while <condition>]`.

Every possible execution branch within the loop body must end with either:
* `continue <next variable values>`
* `break <final out variable values>`
* `return <returned value>`

Here's an example of a binary search implementation:
```
func binarySearch(sortedList: int[], target: int): int
	for let low = 0, let high = sortedList.length - 1, out result = -1 while low <= high
		let middle = (low + high) / 2

		case:
			sortedList[middle] <= target: continue high = middle - 1, result = middle
			otherwise:                    continue low = middle + 1

	return result
```
`let` variables are internal to the loop body. `out` variables are exposed to the outer scope, thus effectively act as the "outputs" of the loop.

`continue high = middle - 1` might look, at first, like variable mutation, which would violate the immutability principle of the language. However, it is not actually a mutation as the reassignment is constrained to take effect at the beginning of the next iteration. This is similar to how loops are expressed through tail recursive functions:

```
func binarySearch(sortedList: int[], target: int): int
	let iterate = (low: int, high: int, result: int) =>
		if low > high:
			return result

		let middle = (low + high) / 2

		case:
			sortedList[middle] <= target: return iterate(low, middle - 1, middle)
			otherwise:                    return iterate(middle + 1, high, result)

	return iterate(0, sortedList.length - 1, -1)
```

The `return` keyword can also be called from within the loop body (this behavior would be more difficult to implement through a recursion):

```
func compareStrings(str1: string, str2: string): int
	for let i = 0 while i < min(str1.length, str2.length) // result of min() is automatically memoized
		case:
			str1[i] > str2[i]: return 1
			str1[i] < str2[i]: return -1
			otherwise:         continue i = i + 1

	case:
		str1.length > str2.length: return 1
		str2.length < str1.length: return -1
		otherwise:                 return 0
```

The `for..in` (or `foreach` in some languages) functionality is supported as well (and will accept any iterator - explained later in this article). It can appear multiple times (first iterator to finish ends the loop):
```
func indexOf(values: int[], target: int): int
	for let num in values, let i in 0..
		case:
			num == target: return i
			otherwise:     continue

	return -1
```

## Functions and Procedures

A function is guaranteed to act like true mathematical function. A `func` cannot cause or observe any side effects and must return the exact same value given the same arguments (referential transparency property). In a sense, an Island function is even "purer" than a Haskell function, since calling an arbitrary Haskell function might still potentially induce a side effect, despite returning an opaque return type (e.g. `IO string` or `IO ()`).

To allow for side effects, `proc`s (procedures) are used instead:

```
proc getMousePosition(): (int, int)
	...
```

`procs` can only be called from other `procs` and the call must be explicitly prefixed with the `do` operator:

```
proc main()
	(let x, let y) = do getMousePosition()
```

(_Note: unlike the concept of a 'procedure' in older languages like Ada and Pascal. An Island procedure can have return values and thus effectively act like a normal function_)

Despite procedures allowing for side-effects outside the program scope, they still strictly follow the immutability principle: variables and objects defined in `proc` scopes still cannot be reassigned or mutated in any way.

Similarly to functions, procedures can be defined in multiple ways:
```
// Procedure declaration, multiple statements possible, overloading possible
proc printName(name: string)
	do print(`Your name is $(name)`)

// Procedure declaration, single expression body, overloading possible
proc printName(name: string) => do print(`Your name is $(name)`)

// Lambda expression, single expression body, overloading not supported
// The expression is automatically classified as a 'proc' due to the call to 'print'
let printName = (name: string) => do print(`Your name is $(name)`)
```

Procedures are further subdivided into two categories:

* `effect proc` is a procedure inducing an action, _causing_ a side effect. `effect proc`s can only be called from other `effect proc`s.
* `view proc` is a procedure _observing_ a side effect. This is analogous to spectators in a sports event. They can watch the game but not influence it. However, their presence might still induce a limited form of a side-effect: too many spectators could congest the stadium or create conflicts, or noise, similarly to how having too many disk read operations could slow down or congest the storage medium or bus channel (but not actually write to the disk). `view proc`s cannot call `effect proc`s.

Example:

```
view proc getMousePosition(): (int, int)
	...

effect proc setMousePosition(x: int, y: int)
	...
```

(By default, the `view`/`effect` classification is detected automatically and doesn't need to be explicitly stated unless the procedure body either performs a an OS call, interops with a method imported from a different language, or is within an interface or base class declaration)


## Classes

Like variables, all objects or structures are (deeply) immutable, this means that class members can only be assigned during construction.

Like in OO languages, classes can have functions, procedures, parameterized constructors, fields, properties (getters only) and indexers (read-only). Constructors must be pure functions thus are not allowed invoke procedures (i.e. `do ...`)

```
class Person
	firstName: string
	lastName: string
	age: int

	new(id: int)
		match id:
			1:
				firstName = "Anonymous"
				lastName = ""
				age = 25
			otherwise:
				firstName = "John"
				lastName = "Doe"
				age = 33

	func titledNameAndAge(title: string): string => `$(title): $(fullName) has age $(age)`

	prop fullName: string => `$(firstName) $(lastName)`

	index (i: int): string
		case:
			i == 0:      return firstName
			i == 1:      return lastName
			otherwise:   return ""

proc main()
	// Default constructor, similar to how a `case class` is constructed in Scala
	let person1 = Person(firstName = "John", lastName = "Smith", age = 22)

	// Custom constructor
	let person2 = new Person(1)

	// Get property value
	let full = person3.fullName

	// Get value through indexer
	let l = person3[1]
```

## Altering fields, arrays and maps

Object fields cannot be modified, but the object can be conveniently cloned and altered:
```
let person3 = person2 alter age = 23
let person4 = person3 alter age = .age + 1 // `.age` is a shorthand for `person3.age`
```

The same applies to arrays:

```
let someArray = [1, 2, 3, 4]
let extendedArray = [...someArray, 5, 6]
let modifiedArray = someArray alter [0] = 5, [3] = 9
```

And maps:
```
let someMap = ["a": 1, "b": 2, "c": 3]
let extendedMap = [...someMap, "d": 4, "e": 5]
let modifiedMap = someMap alter ["a"] = 13, ["c"] = 100
```

## Class inheritance

Like in most OO languages, classes can inherit from at most one base class (single inheritance). Classes are nominal.

```
class Animal
	name: string = "Animal"
	age: int = 0
	maxHeight: int

	new(maxHeight: int)
		.maxHeight = maxHeight

class Cat extends Animal
	name = "Cat"
	age: int

	new(age: int)
		// "super" calls the matching base class constructor.
		// (must be called before any initialization of class members)
		super(maxHeight = 80)

		// To access the now initialized base class members
		// use super.<property name>. For example super.name would return "Animal"

		// Referencing members "age" or "name" before they are initialized would cause a compiler error.
		// This is despite the fact that "name" has a default value

		name = "SomeCat" // The default value "Cat" would be used if this line was commented out
		.age = age

	effector proc meow()
		...

class Dog extends Animal
	name = "Dog"

	new(age: int)
		super(maxHeight = 150)

		name = "SomeDog"
		.age = age

	effector proc bark()
		...
```

## Features (AKA traits, interfaces with default method implementations)

A `feature` is similar to a `trait` in Scala or an `interface` with a default method implementation in Java 8. Features are structural, this means that a `class` does not have to explicitly state it implements one as long as it follows the structure. The `integrates` keywords is used to either:

* Ensure that a class correctly implements a feature.
* Import default method implementations from the feature's definition.

```
feature Greeter
	greet(): string => "Hello!"

class Base
	a = 13

class Example1 extends Base integrates Greeter
	a = 14
	// Default implementation for greet() is used

class Example2 extends Base integrates Greeter
	a = 15

	greet(): string => "Hello from Example2!"
```

## Comprehensions

Comprehensions are high-level, declarative descriptions for the generation of a lazy sequence of values that can be consumed by `for..in` statements. They can be either finite or infinite. For example `0..100` describes the finite sequence of integers between `0` and `100`. `200..` describes an infinite sequence starting at `200`, and continuing indefinitely up to infinity.

_TODO: design and add extended comprehension forms_

## Generators (step functions and procedures)

Generators (also called `step` functions and procedures) can be seen as more 'powerful' forms of comprehensions. They specify sequences in a more programmatically natural and comprehensive and way.

Generators are laid-out similarly to normal functions and procedures, but may include a `yield` statement at any point to denote a value that's being produced by the generator:

```
step func oneToThree()
	yield 1
	yield 2
	yield 3
```
Which can be consumed in the following way:
```
for num in oneToThree()
	do print(num)

// Prints 1, 2, 3
```

The `yield` statement can also appear within a loop. For example, this generators produces a sequence of psuedo-random numbers defined by a seed.
```
step func random(seed: int)
	for let currentRand = seed, _ in 0..
		let nextRand = /*... transform current psuedorandom value to next one ...*/
		yield nextRand
		continue currentRand = nextRand
```
Which can be consumed by:
```
for rand in random(do getCurrentTime())
	do print(rand)
```

_TODO: document `yield return`_

## Consuming comprehensions and generators through step objects

In addition to using `for..in` statements, comprehensions and generators can be consumed through a lower-level sequence of 'step' objects. A 'step' object is a pseudo-object representing a single 'step' of the comprehension or generator. For example, consuming the random number generator above a few times through step objects would look like:

```
let step0 = random(do getCurrentTime()) // Initialize the generator

let step1 <- step0 // consume the 0th step to produce the first step
do print(step1.value) // print the first value
let step2 <- step1 // consume the 1st step to produce the second step
do print(step2.value) // print the second value
let step3 <- step2 // consume the 2nd step to produce the third step
do print(step3.value) // print the third value

// etc..
```
The 'consume' operator, represented by a leftward directed single arrow `<-` can only be applied once. E.g. the following would cause a compilation error:

```
let step0 = random(do getCurrentTime()) // Initialize the generator

let step1_1 <- step0 // consume the 0th step to produce the first step
let step1_2 <- step0 // error: the '<-' operator has already been applied to 'step0'
```

## Coroutines and concurrent functions, procedures and generators

Since Island is intrinsically a thread-safe language (no possibility of data races within the program scope) concurrency can be expressed safely without a need for lower-level synchronization constructs like mutexes, semaphores and monitors.

Every function, procedure or generator can be launched for concurrent execution using the `spawn` keyword. The `spawn` keyword returns a new `step` object, which can consumed similarly to a generator (functions and procedures are treated as generators with a single `yield return` statement in place of every `return` statement).
```
func doSomeComplexMath(input: int)
	....

proc main()
	let resultStep = spawn doSomeComplexMath(1234)
	... // anything here would be computed concurrently to the 'doSomeComplexMath' function
	let result <- resultStep // this would wait until the function's execution
	                         // has finished before assigning to 'result'
```

Spawned generators can be executed concurrently within `for..in` statements. In each iteration of the loop, the next psuedo-random value is precomputed concurrently while the loop body is executing.

```
for rand in (spawn random(do getCurrentTime()))
	// .. do something .. meanwhile, the next 'rand' is calculated in the background
```

`yield`ed values can optionally be set to be produced without waiting for the consumer to consume them. This can be specified individually for each produced value with the `yield buffer` statement:

The following would unconditionally yield the first two values but wait for the consumer to 'synchronize' up to the third value before continuing:
```
step func oneToFourBuffered()
	yield buffer 1
	yield buffer 2
	yield 3
	yield buffer 4
```

## Partial function application and closures

The `partial` operator simply takes a function call expression (though doesn't actually call it) and creates a new function with the given argument(s) fixed to the corresponding parameters:

```
func example(a: int, b: int, c: int): int
	return a*100 + b*10 + c*1

// Ordered:
let partialFunc1 = partial example(5)
let result = partialFunc1(2, 3) // returns 523

// Parameter name based:
// (note this breaks the ordinary sequence of parameters thus requires special attention)
let partialFunc2 = partial example(b = 7)
let result = partialFunc2(a = 2, c = 3) // returns 273
```

Closures can be seen as a form of partial application with the captured argument acting as an implicit argument to the function:

```
func closureExample(a: int): () => int
	let b = a + 1

	// b is considered to be an implicit argument to the capturing function:
	let capturingFunc = (c: int) => b + c

	// Even though the function captures a local variable, it can still be returned as its captured value is
	// considered partially applied.
	return capturingFunc
```

## Exception handling (try .. catch .. finally)

Every procedure or function (still under consideration) can potentially throw an exception. The error is considered an implicit return value, thus function purity is not affected (given the same arguments a function would produce a predictable exception).

```
proc mightThrowProc(filename: string) => do FileSystem.open(filename)
func mightThrowFunc(a: number) => 5 / a

proc main()
	try
		mightThrowProc("myfile.txt")
	catch e
		do print(e)

	// Under consideration:
	try
		result = mightThrowFunc(0)
	catch e
		do print(e)
```

## Enums

(value types are inferred and must be consistent)

```
// Integer enum
enum DayOfWeekNum:
	Monday = 1
	Tuesday = 2
	Wednesday = 3
	Thursday = 4
	Friday = 5
	Saturday = 6

// String enum
enum DayOfWeekString:
	Monday = "Monday"
	Tuesday = "Tuesday"
	Wednesday = "Wednesday"
	Thursday = "Thursday"
	Friday = "Friday"
	Saturday = "Saturday"

// Enums are enumerable:

proc main()
	for let day in DayOfWeekString
		do print(day)
```

## Generic and existential types
## List comprehensions
## Extension methods and properties
## Modules
## Type aliases
## 'Elvis' operator
## Contracts

----

<p align="center">
Copyright © 2017, Rotem Dan<br/>
<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.<br/>
<b>No patents</b> are or would ever be applied on the ideas or software associated with this work.
</p>
