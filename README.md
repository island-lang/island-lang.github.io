<h1 class="main-header">The Island Programming Language</h1>

**Island** (**I**mmutable, **s**equentia**l** **a**nd **n**on-**d**estructive) is a multiparadigm general-purpose programming language fusing aspects of imperative, functional, object-oriented, and logic programming.

It primarily aims to serve as a pragmatic programming tool for real-world applications, and generally inclined towards the mainstream, sequential programming style.

However, the language cannot be formally classified as imperative (it has **no mutable state**), nor as truly functional (it does not promote an idiomatically functional style), nor as traditionally object-oriented language. It is not intended as a hybrid language, but represents a conceptually independent programming approach named **stateless-sequential programming**.

The language also embeds a statically-typed **logic programming subsystem**, that significantly deviates from the Prolog tradition - which mostly concentrates on the centrality of relations - and instead encourages tight interconnections between relations, functions and objects as complementary entities.

[TOC]
# Introduction

## Design goals and constraints

* **All variables and values should be strictly immutable**. I.e. both variables (locally and globally scoped) and values (primitive and compound objects, including any of their fields) must maintain their initial value, forever.
* Adapt common imperative constructs like loops, objects and generators, while maintaining strict adherence to full immutability.
* Maintain a strict separation between pure and side-effect scopes (e.g. `function` vs `action`).
* Maintain a look-and-feel roughly resembling popular imperative languages (e.g Python, TypeScript, C#, Swift).
* Aim for maximum simplicity and readability (good syntax does make a difference!). Aim for low-ambiguity, consistent syntax that reads like plain English (but don't overdo it for its own sake).
* Clean syntax: avoid unnecessary punctuation like `;`, `:`, `{`, `}`, `(`, `)` and cryptic-looking symbols like `$`, `*`, `#`, `^` etc..
* Expressive, rather than minimalist, syntax. No special emphasis on cutting down on special keywords (use context-sensitive awareness to allow identifier names to be used even if they conflict with a keyword that's reserved elsewhere).
* Types should be inferred whenever possible.
* Allow for strong static analysis (static and strong typing, advanced type inference, flow analysis, generics and type classes, non-nullable, algebraic, refinement and assertion types, compile-time contracts).
* Allow for easy and effective concurrency (lightweight threads, deterministic dataflows, asynchronous generators).


## Main innovations

* **[Stateless loops](#loops)** (or alternatively **structured loops**) represent a novel approach to iterative control flow that attempts to synthesize the best of both the imperative and functional idioms.
* **[Accumulative generators](#accumulative-streams-and-named-return-variables)**, as well as **accumulative generator comprehensions** enhance the declarative expressiveness the language by abstracting over the notion of the "prior" output of a generator.
* **[Partially constructed objects](#fixed-fields-and-partially-constructed-objects)** enable the instantiation of classes with one or more missing fields, such that some of its functionality becomes inaccessible. The language models this "partial" instantiation through special types that explicitly specify which of its fields are known and which are not.
* **[Abstract pattern recognizers](#patterns-and-parsers)** are special methods that generalize and abstract over the basic pattern matching expression syntax, as well as traditional regular expressions, by enabling the recognition and capture of arbitrary patterns within any type of input stream.
* **[Relation classes](#logic-programming)** encapsulate logic-programming style relations within immutable container objects. Relation classes are defined using a diverse mixture of programming approaches: rules, predicates, functions and generators.

## Implementation state

The language is currently at an early, design-only stage. A basic parser and compiler have been developed, mostly for the purpose of validating a limited subset of its features (in particular its parsing complexity and the practical efficiency of its looping constructs).

# Fundamentals

## Variables and assignment

Variables are defined using the `let` keyword:
```isl
let x = 24
let greeting = "Hello"
```

Types will be inferred using the values provided, but can also be annotated explicitly:
```isl
let x: integer = 24
let greeting: string = "Hello"
```

**Variables can only be assigned once**:
```isl
let x = 24
x = 25 // Error: invalid reassignment of 'x'
```

## Variable scoping

Variables are accessible from within both their declared scope and any of its nested scopes:
```isl
let x = 1
let greeting = "Hello"

if x > 0
	print(greeting)
```

Variables redeclared using an existing name in an inner scope will shadow the ones in the outer scope:
```isl
let x = 1
let greeting = "Hello"

if x > 0
	let greeting = "Hi"
	print(greeting) // Prints "Hi"

print(greeting) // Prints "Hello"
```

Newly declared variable reusing an existing name will replace the previous one if redeclared in the same scope:
```isl
let greeting = "Hello"
let greeting = "Hi" // This is permitted since the previous binding of `greeting` is not reachable anymore

print(greeting) // Prints "Hi"
```

Shadowing and redeclared variables must receive a type consistent with the previous one:
```isl
let greeting = "Hello"

if x > 0
	let greeting = 25 // Error: shadowing inner variable must be of same type as outer variable
```
```isl
let greeting = "Hello"
let greeting = 25 // Error: redeclared variable must be of same type as its previous binding
```

## Deferred initialization
Initialization can be deferred to a later code position, as long as all branches assign a value:

```isl
let greeting: string

if x > 0
	greeting = "Hello"
else
	greeting = "Hi"
```

If a type is not specified, it would be automatically inferred as long as the assigned values share the same underlying type:
```isl
let greeting

if x > 0
	greeting = "Hello"
else
	greeting = "Hi"

// Type inferred as string
```

This would not work:
```isl
let greeting

if x > 0
	greeting = "Hello"
else
	greeting = 24 // Error: incompatible types
```

## Primitive data types

Island is a **statically typed** language, meaning that every one of its values must be associated with a type that can be determined at compile-time.

Island has a few primitive data types:

* `integer`: arbitrary precision integer number.
* `decimal`: 64-bit floating-point number (IEEE 754).
* `boolean`: Boolean value (`true` or `false`).
* `string`: Unicode character sequence.

## Collection types: lists, tuples, dictionaries and sets

**Lists** are ordered collections of values, in which every element has the same type. They are defined within square brackets and have 1-based indexes:
```isl
let numbers: List<integer> = [1, 2, 3, 4]
let listOfLists: List<List<string>> = [["a", "b"], ["c", "d", "e"], ["f"]]

let m1 = numbers[2] // m1 is 2
let m2 = listOfLists[1][2] // m2 is 'b'

// Two ways of defining empty lists:
let emptyList: List<Integer> = []
let emptyList = List<Integer> []
```

Lists can be extended and concatenated using the spread (`...`) syntax or the `+` operator:
```isl
let l1 = [1, 2]
let l2 = [3, 4, 5]
let l3 = [...l2, 6] // l3 is [3, 4, 5, 6]
let l4 = [...l1, ...l2]  // l4 is [1, 2, 3, 4, 5, 6]

let l5 = [10, 11] + l1 // l5 is [10, 11, 1, 2]
let l6 = l5 + [100] // l6 is [10, 11, 1, 2, 100]
```

List members can be non-destructively altered using the `with` operator:
```isl
let l1 = [100, 200, 300, 400]
let l2 = l1 with [1] = -1 // l2 is [99, 200, 300, 400]
let l3 = l2 with [2] =+ 1, [3] -= 1, no [4]  // l3 is [99, 201, 299]
```

The spread syntax can naturally embed `with` expressions:
```isl
let l1 = [100, 200]
let l2 = [300, 400, 500]
let l3 = [...(l1 with [1] -= 10), ...(l2 with [1] *= 3), 6] // l3 is [90, 200, 900, 400, 500, 600]
let l4 = [...(l3 with no [1], [2] *= 4), -200, 300] // l4 is [800, 900, 400, 500, 600, -200, 300]
```

Lists can be sliced:
```isl
let l1 = [100, 200, 300, 400]
let l2 = l1[2..4] // l2 is [200, 300, 400]
let l3 = l1[3..] // l3 is [300, 400]
```

**Tuples** are ordered collections of fixed length in which each member may have a different type:
```isl
let myTuple: (string, integer) = ("Hi", 24)
let alteredTuple = myTuple with [2] = 42 // myTuple is ("Hi", 42)
```

Tuple members can be named:
```isl
let myTuple: (greeting: string, someNumber: integer) = ("Hi", 24)
let alteredTuple = myTuple with someNumber = 42
```

Island doesn't support 1 or 0 arity tuples:
```isl
let x = (5) // `x` gets the plain type `integer`, there's no single member tuple `(integer)` in Island
let x = () // syntax error, `()` doesn't mean anything in Island
```

**Dictionaries** are unordered collections where the indexing keys can have any type:

```isl
let fruits: Dictionary<string, integer> = { "apple": 55, "lemon": 95, "orange" : 31, "banana": 4 }
let fruitValue = fruits["orange"] // fruitValue is 31

let alteredFruits = fruits with ["apple"] = 12, no ["orange"]
let extendedFruits = { ...alteredFruits, "mango": 76 }

// Two ways of defining empty dictionaries:
let emptyDictionary: Dictionary<string, integer> = {}
let emptyDictionary = Dictionary<string, integer> {}
```

**Sets** are unordered collections containing only unique elements:
```isl
let fruits: Set<string> = { "apple", "lemon", "orange", "banana" }
let fruitValue = fruits["orange"] // fruitValue is 31

let alteredFruits = fruits with ["berries"], no ["orange"]
let extendedFruits = { ...alteredFruits, "mango" }

// Two ways of defining empty sets:
let emptySet: Set<integer> = {}
let emptySet = Set<integer> {}
```

## Unpacking

**Unpacking** (also called **destructuring** in other languages) allows extracting elements from data structures into individual variables:

Unpack a list:
```isl
function getList() => [1, 2, 3, 4]

let [n1, n2, n3, n4] = getList() // n1 = 1, n2 = 2, n3 = 3, n4 = 4
let [x1, x2, ...] = getList() // n1 = 1, x2 = 2
```

Unpack a tuple:
```isl
function getTuple() => (1, 2, 3)

let (a, b, c) = getTuple() // a = 1, b = 2, c = 3
let (x, _, z) = getTuple() // x = 1, z = 3
let (n, ...) = getTuple()  // n = 1
```

Objects (introduced in a future chapter) are unpacked based on the order of declared members:
```isl
class Person
	firstName: string
	lastName: string
	age: integer

let person = Person("John", "Doe", 25)
let (f, _, a) = person // f = "John", a = 25
```

Lists allow for some additional unpacking patterns:
```isl
let values = [1, 2, 3, 4, 5]

// Capture head and tail of a list:
let [head, ...tail] = values // head = 1, tail = [2, 3, 4, 5]

// Capture first, second, and all the rest elements of the list:
let [first, second, ...rest] = values // first = 1, second = 2, rest = [3, 4, 5]

// Capture first and last elements:
let [firstElement, ..., lastElement] = values // firstElement = 1, lastElement = 5
```

# Subroutines

## Functions, actions and computed variables

The Island language has two main subroutine types: functions and actions.

**Functions** are "pure", in the sense they do not have side effects (no hidden change of state) and maintain referential transparency (given the same set of arguments, they would always return the same value).

```isl
function sum2(x: integer, y: integer) => x + y // Short syntax

function sum3(x: integer, y: integer, z: integer) // Long syntax
	return x + y + z

let result = sum3(2, 3, 4)
print("Result: {result}")
```

**Actions** extend functions and allow for _external_ side-effects. Actions can return values but can only be called from other actions (or the topmost scope):
```isl
action printNameAndAge(name: string, age: integer)
	print("Name: {name}, Age: {age}")
	return "OK"

let status = printNameAndAge("John Smith", 35) // Prints "Name: John Smith, Age: 35" and returns "OK"
```

Despite allowing for "impure" operations like writing or reading from a file, actions do not allow for side-effects _internal_ to the program itself, since all variables and values are always guaranteed to be immutable. This doesn't prevent, however, mutable state to be weakly "emulated" through, say, reading and writing to external memory:

```isl
action readMutableState() => readFile("myFile.state")
action writeMutableState(data: string) => writeFile("myFile.state", data)

let initialData = readMutableState()
writeMutableState(initialData + " changed!")

let modifiedData = readMutableState()
```

The program can read and write to external mutable state. However, the modified data must be read into a new variable (here `modifiedData`) so the _internal_ state of the program (its variables and values) is never altered.

**Computed variables** are functions that are referenced as if they were plain variables. They are only evaluated when first used:

Short form:
```isl
let a = 5
let b = 3
let c => a * b // computed variable `c` is not evaluated at this point

let x = c + 1 // `c` is now evaluated to 15 and `x` gets the value 16
```

Long, function like, form:
```isl
let a = 5
let b = 3

computed c()
	let a1 = a + 1
	let a2 = b + 1
	return a1 * a2
```

We will often collectively refer to functions, actions, and computed variables (and later include class computed fields and indexers) as **methods**, which is just another name for subroutines.

## Named and default arguments

```isl
action printNameAndAge(name = "Anonymous", age = 0)
	print("Name: {name}, Age: {age}")

printNameAndAge(age = 12) // prints Name: Anonymous, Age: 12
printNameAndAge(_, 12) // prints Name: Anonymous, Age: 12
```

## First-class methods and lexical closures

**First-class methods** is a language feature allowing functions (and actions) to be used similarly to values. They can be assigned to variables, returned from a secondary method, or passed as an argument:

```isl
function giveMeFunction(f: () => integer)  // This function accepts an argument of type function
	return f() + 1
```

A **lexical closure** allows a method to capture data from its environment:

```isl
function outerFunction(x: integer): () => integer // This function returns a value of type 'function'
	function innerFunction()
		return x + 1 // x is captured from the outer scope

	return innerFunction
```

## Anonymous methods

Anonymous methods, also known as **lambda expressions** are functions or actions that are defined as expressions and are not bound to any identifier.

```isl
let sum2 = (n1: integer, n2: integer) => n1 + n2 // Explicit parameter types
let sum2 = (n1, n2) => n1 + n2 // Implicit parameter types
let negative = n: integer => -n // Single explicitly typed parameter
let negative = n => -n // Single implicitly typed parameter

// Since 'print' is an action 'printInQuotes' implicitly becomes a action as well
let printInQuotes = s => print("'{s}'")
```

## Method overloading

**Overloading** allows defining multiple methods sharing the same name, but with different parameter types.

Methods can be overloaded:
```isl
function f(a: integer, b: integer) => a * 2
function f(a: integer, b: string) => "{a}: {b}"
function f(a: boolean) => not a
```

Overloads can only differ by parameter types, not return types:
```isl
function f(a: integer): integer => a * 2
function f(a: integer): decimal => a * 2.0 // Error
```

Overloaded methods can be compacted to a shorter form:

```isl
function f
	(a: integer, b: integer) => a * 2
	(a: integer, b: string) => "{a}: {b}"
	(a: boolean) => not a
```
_(The usefulness of this syntax will become more apparent when refinement and assertion types are introduced in a later chapter, stay tuned!)_

## Function and action types

Function and action types can be written in several ways:

```isl
// Short form (unnamed parameters):
let f: (integer) => string
let f: (integer, boolean) => string
let a: action (string) => (integer, integer)

// Long form (named parameters):
let f: (index: integer) => string
let f: (index: integer, isUnique: boolean) => string
let a: action (message: string) => (integer, integer)
```

## Rest parameters

A method's last parameter, typed as a list, can be prefixed with `...` to accept all remaining arguments as its members:

```isl
function sum(...numbers: List<integer>) =>
	numbers.reduce((sum, number) => sum + number)

let r1 = sum(1, 6, 3, 7) // r1 = 17
```

```isl
function multiplyAllBy(multiplier: integer, ...numbers: List<integer>) =>
	numbers.map(number => number * multiplier)

let r2 = multiplyAllBy(10, 1, 2, 3, 4, 5) // r2 = [10, 20, 30, 40, 50]
```

It is also possible to explicitly pass a list to a rest parameter, using `...` as a suffix instead of a prefix:
```isl
function multiplyAllBy(multiplier, ...numbers: List<integer>) =>
	numbers.map(number => number * multiplier)

let nums = [1, 2, 3, 4, 5]
let r2 = multiplyAllBy(10, nums...) // r2 = [10, 20, 30, 40, 50]
```

Sometimes it is more convenient to pass arguments bundled together as a tuple. This is possible by applying the `...` prefix on the tuple passed, and would work even for methods that don't include a rest parameter:
```isl
function averageOf3(a: decimal, b: decimal, c: decimal) =>
	(a, b, c) / 3.0

let nums = (4.0, 5.0, 7.0)
let average1 = averageOf3(nums...) // pass nums tuple elements to parameters a, b, c
let average2 = averageOf3(2.0, nums[2..3]...) // pass nums tuple elements 2..3 to parameters b, c
```

## Arguments collection

The `arguments` keywords allows getting a tuple bundling all the arguments passed to the current method:
```isl
action printArguments(a: integer, b: integer, c: integer) =>
	print(arguments)

printArguments(1, 4, 5) // Prints "(1, 4, 5)"
```

## Partial application

Partial application allows to transform a given method to a new method with one or more of its arguments bound to fixed values:
```isl
action printThreeNumbers(a: integer, b: integer, c: integer)
	print(a)
	print(b)
	print(c)

let print5AndTwoNumbers = printTwoNumbers(5, ...)
// print5AndTwoNumbers has the signature print5AndTwoNumbers(b: integer, c: integer)

print5AndTwoNumbers(9, -3) // prints "5 9 -3"

let print5And3AndNumber = printTwoNumbers(5, 3, ...)
// print5And3AndNumber has the signature print5And3AndNumber(c: integer)

print5And3AndNumber(1) // prints "5 3 1"
```

The `with` operator can be used to partially apply any subset of parameters, regardless of their declared order:
```isl
let partiallyAppliedAction = printThreeNumbers with b = 11
// partiallyAppliedAction has the signature partiallyAppliedAction(a: integer, c: integer)

partiallyAppliedAction(a: 4, c: 8) // Prints 4, 11, 8
partiallyAppliedAction(c: 6) // Error: an argument for `a` must be specified
```

Methods may be partially applied any number of times:
```isl
let partiallyAppliedAction2 = partiallyAppliedAction with a = 94
// partiallyAppliedAction2 has the signature partiallyAppliedAction2(c: integer)

partiallyAppliedAction2(c = -4) // Prints 94, 11, -4
```

If the target method has multiple overloads, the overload can be disambiguated by including a tuple containing the selected types for the unspecified members:

```isl
action printThreeNumbers(a: integer, b: integer, c: integer)
	print(a)
	print(b)
	print(c)

action printThreeNumbers(a: integer, b: decimal, c: decimal)
	print(a)
	print("{b}")
	print("{c}")

let print5AndTwoNumbers = printThreeNumbers(5, ...) // Error! Ambiguous call. There are two matching overloads!

let print5AndTwoNumbers = printThreeNumbers(5, ...(decimal, decimal)) // OK
```

## Abstract method types

The `(param1: ParamType, param2: ParamType, ...) => ReturnType` syntax defines abstract method types. An identifier holding a method of this type cannot be directly invoked, only passed around or partially applied:
```isl
type PartialIntFunc = (integer, ...) => integer

function applyFirstArgument(f: PartialIntFunc, value: integer): PartialIntFunc
	return f(value, ...)

function sum(a: integer, b: integer) => a + b

let partiallyAppliedSum = applyFirstArgument(sum, 11)
// Type of partiallyAppliedSum is (b: integer) => integer

partiallyAppliedSum(2) // returns 13
```

In the above example `(integer, ...) => integer` represents a function having any number of parameters where the first parameter must be compatible with `integer` and the return type must be compatible with `integer`.

Other abstract function type examples:

* `(...) => any` represents a function of any number of parameters returning a value of any type other than `nothing` (the `any` type is described in detail in a following chapter).
* `(...) => any?` represents a function of any number of parameters returning a value of any type, including `nothing`.
* `(string, _, integer, _) => any?` represents a function of four parameters where the first parameter must be of type `string` and third of type integer, and any return type (including `nothing`).

_Note that due to contravariance of function parameters (described in a future chapter), a function including a parameter of type `any?`, e.g `(any?) => integer` is not assignable from a function of type `(T) => integer` where `T != any?`. Unlike `any?`, the `_` type represents a type that is both a super-type of all types and a subtype of all types, so it can substitute for every possible parameter type)_.

## Strong and weak side-effect scopes

Up until now, we've made a clear distinction between "pure" and "side-effect" scopes. Functions encompass purely deterministic computations. Actions, on the other hand, allow for external interaction (I/O, file reads and writes) as well as unpredictable operations (e.g. random number generators, timers etc.).

We can refine the distinction further to distinguish between two main classes of side-effects:
1. Operations inducing clear impact on the external environment. e.g. writing to a file, moving a robot arm, displaying information on the monitor etc.
2. Operations that only observe or query information from the larger computing environment (e.g. reading an open file or screen pixel data) as well as operations that are unpredictable by nature (measuring time, reading data from a hardware random number generator etc).

We can roughly classify the first class as "strong", since they clearly impact the system and the user at large. The second class could be described as "weak" in the sense that it doesn't actually "do" anything - they pose no "risk" aside from requiring a minor amount of computing resources.

The Island language provides an optional way to explicitly mark those weaker scopes, albeit these are open to the developers' own judgment to be marked as such:

```isl
view action getCurrentTime()
	....
```

`view` actions can only call other view actions, as well as functions. They cannot call regular (strong) actions.


# Control flow

## Conditionals

The traditional **`if` - `else if` - `else`**:
```isl
function abs(num: integer)
	if num == 0
		return 0
	else if num < 0
		return -num
	else
		return num
```

The conceptually similar, but more constrained **`when `-` otherwise`** syntax, which also allows for using `=>` to directly return a value from the enclosing method:
```isl
function abs(num: integer)
	when num == 0 => 0   // Equivalent to 'if num == 0 ..'
	when num < 0 => -num // Equivalent to 'else if num < 0 ..'
	otherwise => num     // Equivalent to 'else ..'
```

The most important difference between `if`-`else if`-`else` and `when`-`otherwise` is that `when`-`otherwise` **cannot be followed by any other statement** in its enclosing scope.

So this is OK:
```isl
function abs(num: integer)
	if num == 0
		return 0

	let x = num

	when x < 0 // OK since when - otherwise sequence is not followed by anything
		return -x
	otherwise
		return x
```

But this is not:
```isl
function abs(num: integer)
	when num < 0 => -num
	when num > 0 => num

	return 0 // Error, a 'when' statement sequence cannot be followed by any other statement
```

`when` can also be written as an expression:
```isl
let abs = (num: integer) =>
	when num > 0: num, when num < 0: -num, otherwise: 0

function gcd(a: integer, b: integer) =>
	when b == 0: abs(a), otherwise: gcd(b, a mod b)
```

This function uses a dictionary and a `when` statement to convert an integer number on the range 1..999 to words:
```isl
function numToWords(num: 1..999): string
	let numberNames = { 0: "", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten", 11: "eleven", 12: "thirteen", 13: "thirteen", 14: "fourteen", 15: "fifteen", 16: "sixteen", 17: "seventeen", 18: "eighteen", 19: "nineteen", 20: "twenty", 30: "thirty", 40: "fourty", 50: "fifty", 60: "sixty", 70: "seventy", 80: "eighty", 90: "ninety" }

	when num <= 20 or (num < 100 and num mod 10 == 0) =>
		numberNames[num]
	when num < 100 =>
		"{numToWords(n / 10)} {numToWords(num mod 10)} ".trimWhitespace()
	otherwise =>
		"{numToWords(n / 100)} hundered {numToWords(num mod 100)}".trimWhitespace()
```

## Pattern matching

**Pattern matching** is a form of a conditional which inspects one or more target values and their internal component parts. The `match`-`case` syntax expands over the traditional `switch`-`case` with more expressive control:

_(`_` matches the target value, which is `num` in this example)_

```isl
// (long statement form)
function abs1(num: integer)
	match num
		case 0
			return 0
		case _ < 0
			return -num
		otherwise
			return num

// (short statement form, '=>' returns a value from the enclosing method)
function abs2(num: integer)
	match num
		case 0 => 0
		case _ < 0 => -num
		otherwise => num

// (expression form)
let absOfVal = match num:
	case 0 => 0,
	case _ < 0 => -num,
	otherwise => num
```

Match a tuple:
_(here `_` contextually matches the corresponding element of the target tuple `someTuple`)_
```isl
function tupleMatch(someTuple: (integer, string, boolean))
	match someTuple
		case (_, "Hi", _) => "Case 1"
		case (_ > 1 and _ < 5, _.length > 2, _) => "Case 2"
		case (_ > 1, _[1] == "O", false) => "Case 3"
		otherwise => "No match"

let r1 = matchTuple((1, "Hi", true))    // returns "Case 1"
let r2 = matchTuple((4, "Hello", true)) // returns "Case 2"
let r3 = matchTuple((100, "OK", false)) // returns "Case 3"
let r3 = matchTuple((100, "OK", true))  // returns "No match"
```

Matched elements can be nested, and can be captured using the `let` keyword:
```isl
function nestedTupleMatch(someNestedTuple: (integer, string, (boolean, string)))
	match someNestedTuple
		case (_, "Hi", (true, let name)) => "Case 1, {name}"
		case (let num, "Hi", (true, _)) => "Case 2, {num}"
		otherwise => "No match"
```

Matching over an object (as well as a tuple with named members) introduces its members into the `case` scope:
```isl
class Person
	firstName: string
	lastName: string
	age: integer

function matchObject(person: Person)
	match person
		case firstName == "James" and lastName.length > 2 => "Case 1"
		case firstName[-1] == "e" and age >= 30 and age <= 35 => "Case 2"
		otherwise => "No match"

let r1 = matchObject(new Person("James", "Redd", 21)) // returns "Case 1"
let r2 = matchObject(new Person("Jane", "Doe", 33)) // returns "Case 2"
let r2 = matchObject(new Person("Jane", "Doe", 37)) // returns "No match"
```

In case the concrete type of the target object may be one of several derived types, the **type can be matched** as well:
```isl
function matchAnimal(animal: Animal)
	match animal
		case Dog where name == "Lucky" and owner.firstName == "Andy" => "Good dog, Andy!"
		case Cat where age > 10 => "Old cat!"
		case Horse where height > 180 => "Tall horse!"
		otherwise => "Nothing interesting here"
```

A secondary syntax uses curly brackets to define a matching structure, which can be nested any amount of times:
```isl
function matchAnimal(animal: Animal)
	match animal
		case Dog { name == "Lucky", owner: { firstName == "Andy" } } => "Good dog, Andy!"
		case Cat { age > 10 } => "Old cat!"
		case Horse { height > 180 } => "Tall horse!"
		otherwise => "Nothing interesting here"
```

A third, terser matching syntax uses constructor-like notation, based on the order of declared members (note the varying count of elements in parentheses and the `...` element signifying the rest of the elements are ignored):
```isl
function matchAnimal(animal: Animal)
	match animal
		case Dog("Lucky", Person("Andy",...), ...) => "Good dog, Andy!"
		case Cat(_, _ > 10, ...) => "Old cat!"
		case Horse(_, _, _ > 180) => "Tall horse!"
		otherwise => "Nothing interesting here"
```

`match` can be applied to multiple variables, separated by commas:
```isl
function matchAnimalAndPerson(animal: Animal, person: Person)
	match animal, person
		case Dog where name == "Lucky", Man where age < 18 => "Good dog and young man!"
		case Cat where age > 10, Woman where happinessLevel > 0.8 => "Old cat and happy woman!"
		case Horse where height > 180, Person where hobby == "Horseriding" => "Tall horse and a true horseriding lover!"
		otherwise => "Nothing interesting here"
```

Matching on multiple Boolean expressions allows to concisely specify a decision table:
```isl
function hasPromotions(repeatCustomer: boolean, hasMemberCard: boolean, orderAmount: decimal):
	(freeShipping: boolean, discountPercent: decimal)

	match repeatCustomer, hasMemberCard, orderAmount >= 100, orderAmount >= 1000
		case true, _   , false, false => (freeShipping: true, discountPercent: 0)
		case _   , true, false, false => (freeShipping: true, discountPercent: 0)
		case true, true, true , false => (freeShipping: true, discountPercent: 0.05)
		case true, true, true , true  => (freeShipping: true, discountPercent: 0.10)
		otherwise                     => (freeShipping: false, discountPercent: 0)
```

`match` cases can be **nested** without needing to introduce a new `match` declaration. The nested `case` clauses receive the enclosing match target value, as well as any type or conditional assertions that were made by its ancestors:
```isl
function matchAnimal(animal: Animal)
	match animal
		case Dog where name == "Lucky"
			case barkingLoudness < 0.3 => "Quite dog lucky!"
			case barkingLoudness > 0.7 => "Loud dog lucky!"
			otherwise => "Nice dog lucky!"

		case Cat
			case likesMilk => "Nice cat!"
			otherwise => "A cat who doesn't like milk! Who knew?"

		case Horse where height > 180 => "Tall horse!"
		otherwise => "Nothing interesting here"
```

Matching over a list allows for the unpacking syntax to be used as a matching pattern:
```isl
function matchList(myList: List<integer>)
	match myList
		// Match if 'myList' is empty
		case []

		// Match first element only if it is smaller than 10 and capture it with the identifier 'head':
		case [let head < 10, ...]

		// Match if first element equals 25 and capture the last element as 'last':
		case [25, ..., let last]

		// Match if first element is greater or equal to 10. Capture the tail of the list with the identifier 'tail':
		case [_ >= 10, let ...tail]

		// Match if first element smaller than 0, second not equals to first,
		// capture them and the rest with the identifers 'first', 'second', 'rest':
		case [let first < 0, let second != first, let ...rest]

		// Find the first member of the list that's greater than 5:
		case [..., let v > 5, ...]
```

Using similar syntax, list-typed method parameters can be pattern-matched as well:

```isl
function minimumValue
	([]: List<integer>, currentMinimum: integer) => currentMinimum

	([head, ...tail]: List<integer>, currentMinimum = infinity) =>
		minimumValue(tail, minimum(head, currentMinimum))
```

## Matched parameters

Many examples in the previous section had the form:
```isl
function funcName(param1: ...., param2: ....)
	match paramX, ....
		case ....
		case ....
		otherwise ....
```

If the outermost scope of a method consists only of a `match` statement (excluding any `let`s, nested method or type declarations), the `match paramX, ....` statement can be omitted and instead integrate directly into the function declaration, by modifying the matched parameters with the `match` keyword:

```isl
function matchAnimalAndPerson(match animal: Animal, match person: Person)
	case Dog where name == "Lucky", Man where age < 18 => "Good dog and young man!"
	case Cat where age > 10, Woman where happinessLevel > 0.8 => "Old cat and happy woman!"
	case Horse where height > 180, Person where hobby == "Horseriding" => "Tall horse and a true horseriding lover!"
	otherwise => "Nothing interesting here"
```

Observing the above carefully, it may be noticed the `: Animal` and `: Person` annotations are not strictly necessary, since the parameter types are being explicitly asserted at every case clause. When this is the case, the type annotations can be omitted and would be inferred by the compiler:
```isl
function matchAnimalAndPerson(match animal, match person)
	case Dog where name == "Lucky", Man where age < 18 => "Good dog and young man!"
	case Cat where age > 10, Woman where happinessLevel > 0.8 => "Old cat and happy woman!"
	case Horse where height > 180, Person where hobby == "Horseriding" => "Tall horse and a true horseriding lover!"
	otherwise => "Nothing interesting here"

	// Note the 'otherwise' clause must fail for the parameter types to be properly inferred!
	//
	// Having a non-failing 'otherwise' clause would mean that the function
	// could possibly accept any type for 'animal' and 'person' and still succeed!
```

The `matchAnimalAndPerson` function type is inferred to include several overloads, corresponding to each valid type combination case. Variants with and without assertion types (introduced in a later chapter) are shown:
```isl
// Without assertion types, the compiler infers:
function matchAnimalAndPerson(animal: Dog, person: Man)
function matchAnimalAndPerson(animal: Cat, person: Woman)
function matchAnimalAndPerson(animal: Horse, person: Person)

// With assertion types, the compiler infers:
function matchAnimalAndPerson(animal: Dog where name == "Lucky", person: Man where age < 18)
function matchAnimalAndPerson(animal: Cat where age > 10, person: Woman where happinessLevel > 0.8)
function matchAnimalAndPerson(animal: Horse where height > 180, person: Person where hobby == "Horseriding")
```

Even without the `match` modifier, parameter types can still be omitted and asserted in the method body using the `is` operator:
```isl
function testXY(x, y)
	when x is integer
		when y is integer
			when x > y and x > 0 => 1
			when x < y or y == 0 => -1
			otherwise => 0
		when y is decimal
			when x > y and x > 0 => 1.0
			when x < y or y == 0.0 => -1.0
			otherwise => 0.0

	// (Note the omitted 'otherwise' clauses are interpreted as a fail cases)

// Inferred signature:
// function testXY(x: integer, y: integer)
// function testXY(x: integer, y: decimal)
```
## Exhaustiveness checking

The compiler will try to ensure that matched cases include all possible values for a type:
```isl
function notExhaustive(someBoolean: boolean)
	match someBoolean
		case true => "OK!"
		// Error! No handling of the case when someBoolean == false
```

## Single pattern matching

Sometimes it may be useful to match a value against a single pattern. The `matches` operator allows that:

```isl
function firstTwoElementsAreConsecutive(values: List<integer>): boolean =>
	values matches [let first, let second == first + 1, ...]
```

## Loops

**Loops** are control flow mechanisms for specifying code to be executed repeatedly.

In Island, **loops are rooted in functional iteration patterns** and describe iterative progression in a more declarative way than in traditional sequential languages.

Island's `for` loops maintain immutability for all variables within the scope of **each individual iteration** of the loop. This is achieved by:
* Requiring all alterable variables to be declared at the head of the loop.
* Requiring all variable alterations to be conducted within a `continue` or `break` statement, or within the loop's `advance` clause.
* Requiring variables exposed to the outer scope (after the loop has finished) to be declared with the `out` modifier.

Here's the factorial operation, implemented using a `for` loop:
```isl
function factorial(num: integer)
	for i = 1, out result = 1
		if i <= num
		 	// The continue statement defines the next values of 'result' and 'i':
			continue result = result * i, i = i + 1

	return result
```

It may seem, at first, like `i` and `result` are no different than mutable variables, since they are repeatedly modified at every iteration, however, they are not actually mutable because they are not real variables!

Since Island loops act a lot like functions, `i` and `result` could be thought as being analogous to a function parameter and a return variable. Since the `continue` statement is only executed at the moment the loop is ready to proceed to its next iteration, it can be seen as if the loop is "restarting" with a different initial state. This is analogous to a function being repeatedly tail-recursively invoked with a different set of arguments.

For comparison, here is equivalent code, translated to a tail-recursive function (reference code lines are in the comments):
```isl
function factorial(num: integer)
	// for i = 1, out result = 1
	function iterate(i = 1, result = 1)
		// if i <= num
		if i <= num
			// continue result = result * i, i = i + 1
			return iterate(result = result * i, i = i + 1)
		else
			// (implicitly returns)
			return result

	// return result
	let iterationResult = iterate()
	return iterationResult
```

The `for` loop syntax also allows to define a continuation condition using a `while` clause and a set of predefined alterations using an `advance` clause, which are applied after any alterations in a `continue` statement within the loop body. The `factorial` function can be rewritten to:
```isl
function factorial(num: integer)
	// In C-style languages this would be written as:
	// int result;
	// for (int i = 1, result = 1; i <= num; i += 1)
	for i = 1, out result = 1 while i <= num advance i += 1
		continue result *= i

	return result
```

Loops can be aborted with the `break` keyword, which also allows for alterations of `out` variables:
```isl
function boundedFactorial(num: integer)
	for i = 1, out result = 1 while i <= num advance i += 1
		when i < 100
			continue result *= i
		otherwise
			break result = nothing

	return result
```

Here's a binary search implemented using a `for` loop and pattern matching, formatted to allow for better readability:
```isl
function binarySearch(values: List<integer>, target: integer)
	for low = 1, high = values.length, mid = (low + high) / 2
	while low <= high
	advance mid = (low + high) / 2
		match values[mid]
			case target
				return mid
			case _ < target
				continue low = mid + 1
			otherwise
				continue high = mid - 1

	return nothing
```

Here's equivalent code translated to a tail-recursive function (original code in comments):
```isl
function binarySearch(values: List<integer>, target: integer)
	// for low = 1, high = values.length, mid = (low + high) / 2
	// ..
	// advance mid = (low + high) / 2
	function iterate(low = 1, high = values.length, mid = (low + high) / 2)
		// while low <= high
		when low <= high
			match values[mid]
				case target
					// return mid
					return mid
				case _ < target
					// continue low = mid + 1
					return iterate(low = mid + 1, high = high)
				otherwise
					// continue high = mid - 1
					return iterate(low = low, high = mid - 1)
		otherwise
			// return nothing
			return nothing

	return iterate()
```

Loops can be **nested**:
```isl
function combinationsOf2(min: integer, max: integer)
	for x = min, out result: List<(integer, integer)> = []
	while x <= max
	advance x += 1
		for y = min, out row: List<(integer, integer)> = []
		while y <= max
		advance y += 1
			continue row += [(x, y)]

		continue result += row

	return result

print(combinationsOf2(0, 1)) // prints [(0, 0), (0, 1), (1, 0), (1, 1)]
```

Nested loops are also reasonably straightforward to translate to recursive form:
```isl
function combinationsOf2(min: integer, max: integer): List<(integer, integer)>
	function iterateX(x = min, result: List<(integer, integer)> = [])
		function iterateY(y = min, row: List<(integer, integer)> = [])
			when y <= max => iterateY(y = y + 1, row = row + [(x, y)])
			otherwise => row

		when x <= max => iterateX(x = x + 1, result = result + iterateY())
		otherwise => result

	return iterate()
```

However, directly returning from an inner loop would be more tricky to express in recursive form. For example, the following function, which iterates to find a value in a square matrix:
```isl
function findFirstInSquareMatrix(matrix: List<List<integer>>, value: integer): (integer, integer)?
	for x = 1
	while x <= matrix.length
	advance x += 1
		for y = 1
		while y <= matrix.length
		advance y += 1
			if matrix[x][y] == value
				return (x, y)

	return nothing
```
Would be roughly translated to:
```isl
function findFirstInSquareMatrix(matrix: List<List<integer>>, value: integer): (integer, integer)?
	function iterateX(x = 1): (integer, integer)?
		function iterateY(y = 1): (integer, integer)?
			when y <= matrix.length
				when matrix[x][y] == value => (x, y)
				otherwise => iterateY(y = y + 1)
			otherwise => nothing

		let result = iterateY()
		when result is not nothing => result
		when x < matrix.length => iterateX(x = x + 1)
		otherwise => nothing

	return iterateX()
```

## Shorthand `with` expressions in `continue` and `break` statements

It is common in `continue` and `break` statements to use `with` to alter one or more of the iteration variables, for example:

```isl
for someTuple = (a: 1, b: 2)
	continue someTuple = someTuple with (a += 2, b -= 5)
```

Instead of writing `someTuple = someTuple with ...`, the `with` operator can be shortened to:

```isl
for someTuple = (a: 1, b: 2)
	continue someTuple with (a += 2, b -= 5)
```

# Data streams

## Stream methods

A **stream method** (also called a **generator**) is a form of a subroutine enabling the incremental production of a sequence of values. Calling a stream method returns a **stream object** (also called an **iterator**), which is an object allowing step-wise consumption of the values produced by the stream method.

Stream methods produce values using the `yield` statement. Streams can be consumed within `for` loops using the `x in stream` clause:

```isl
stream naturalNumbers()
	for i = 1 advance i += 1
		yield i

for i in naturalNumbers() // Loops forever
	print(i)

// Prints 1, 2, 3, 4, 5, ....
```

**Multiple streams** may be consumed within a single `for` loop. At every iteration, each stream is evaluated once by its order of declaration. The loop will terminate whenever any one of the streams end:
```isl
action stream keypresses()
	repeat
		let key = getKeyPress()
		yield key

for i in 1..100, key in keypresses() // This will repeat 100 times
	print("Keypress {i} was '{key}'")
```

A **stream object** is a stateless object, of the form:
```isl
class Stream<T>
	value: T? // The '?' means `value` may be of type `nothing`
	ended: boolean
	function next(): Stream<T> // For an action stream, `next` would be an action instead
```

Calling `next()` returns a new stream object, and would cause the previous one to be disposed (any attempt to access it would cause a runtime error).
```isl
stream numsInRange(min: integer, max: integer)
	for i in min..max
		yield i

let step0 = numsInRange(1, 3)

let step1 = step0.next() // The stream requires an initial next() call to produce its first value.
print(step1.value) // Prints 1

let step2 = step1.next()
print(step2.value) // Prints 2

print(step1.value) // Error! step1 object has been disposed when step1.next() was called.
```

The `Stream<T>.toList()` expansion method accumulates all successive elements of the stream into a list.

Using streams and `toList()`, a previous example - which enumerates all combinations of two integers in a given range - can now be simplified further:
```isl
function combinationsOf2(min: integer, max: integer)
	stream enumerateCombinations()
		for x in min..max
			for y in min..max
				yield (x, y)

	return enumerateCombinations().toList()
```

(_Note calling `toList()` on an infinite stream would never terminate and may rapidly consume all machine memory!_).

A stream can yield the content of another stream using `yield stream`:
```isl
stream a()
	for x in 1..5
		yield x

stream b()
	for x in 9..12
		yield x

stream c()
	yield stream a // no need for parentheses if stream method has no parameters
	yield stream b

for value in c
	print(value)

// prints 1, 2, 3, 4, 5, 9, 10, 11, 12
```

## Accumulative streams and named return variables

Oftentimes it is useful to be able to make small, incremental alterations to a value, such as when piecing out a string, building an object, sorting a list, or calculating a complex math formula.

Imagine you wanted to create a function that builds a URL string from an object specifying its parts. In an imperative language, that would be easy. You could write something like:

```isl
function urlTostring(url: Url): string
	var urlstring = "" // There's no 'var' in Island - this is only meant for illustration

	if url.isSecure
		urlstring += "https://"
	else
		urlstring += "http://"

	urlstring += url.hostname

	if url.port is not nothing
		urlstring += ":{url.port}"

	// ....

	return urlstring
```

Unfortunately Island doesn't support the `var` keyword, so how could we approach this?

One option would be to give a different name to `urlstring` every time we want to change it:

```isl
function urlTostring(url: Url): string
	let urlstring1

	if url.isSecure
		urlstring1 = "https://"
	else
		urlstring1 = "http://"

	let urlstring2 = urlstring1 + url.hostname

	let urlstring3
	if url.port is not nothing
		urlstring3 = urlstring2 + ":{url.port}"

	// ....

	return urlstringX
```

That looks, well, pretty bad. Couldn't we do better than that?

OK, so how about using an inner stream method?
```isl
function urlTostring(url: Url): string
	stream buildstring()
		if url.isSecure
			yield "https://"
		else
			yield "http://"

		yield url.hostname

		if url.port is not nothing
			yield ":{url.port}"

		// ....

	return buildstring().JoinStrings("")
```

Looks a bit better! but a solution like this will only work for simple list concatenations, we want something more flexible that would generalize over to arbitrary computations of a similar nature.

The general pattern seems to be that every yielded value "builds" over the previous one. So maybe the `yield` statement could provide a "placeholder" variable that would represent the previous value? something like:

```isl
function urlTostring(url: Url): string
	stream buildstring()
		yield initial ""

		if url.isSecure
			yield prior + "https://"
		else
			yield prior + "http://"

		yield prior + url.hostname

		if url.port is not nothing
			yield prior + ":{url.port}"

		// ....

	return buildstring().last()
```

We'll call this an **accumulative stream**.

However, this still doesn't look pretty (frankly, even more verbose than the previous solution), we've got that nested function, and all those repeated `yield prior ..`s. Also, do we really need to yield all those intermediate results? There must be a simpler way.

We can take this pattern and make it more implicit by introducing the notion of a **named return variable**:

```isl
function urlTostring(url: Url): (urlstring: string = "")
	if url.isSecure
		urlstring = urlstring + "https://"
	else
		urlstring = urlstring + "http://"

	urlstring = urlstring + url.hostname

	if url.port is not nothing
		urlstring = urlstring + ":{url.port}"

	// ....

	// No need to return anything, since the return variable(s) have been explicitly declared
```

But wait a minute! you said Island didn't have `var`, and here you're using `urlstring` like it was mutable? what's going on?

The answer is that `urlstring` is not really mutable because it is not a real variable! It is a placeholder for a `yield` pattern representing incremental computations. The pattern:
```isl
returnVariable = <expression possibly including returnVariable>
```
Is equivalent to:
```isl
yield <expression possibly including prior>
```
And:
```isl
: (returnValue: T = initialValue)
```
Is equivalent to:
```isl
yield initial initialValue
```

And finally, returning from the function implicitly returns the last value yielded.

Now we can now allow the `resultVariable = resultVariable + something` pattern to be shortened to `resultVariable += something`:
```isl
function urlTostring(url: Url): (urlstring: string = "")
	if url.isSecure
		urlstring += "https://"
	else
		urlstring += "http://"

	urlstring += url.hostname

	if url.port is not nothing
		urlstring += ":{url.port}"

	// ....

	// No need to return anything, urlstring is returned by default
```
And here you go! looks like reasonable code.

Now let's try to define more precisely what exactly are the constraints on a named return variable:

A **named return variable** is a special variable that:

* **Can** be reassigned multiple times, including from within conditionals and loop bodies.
* **Can** be passed to any method (including to an action or an object initializer).
* **Can only** be read from within an expression that is **assigned back to itself**.
* **Cannot** be accessed from within a nested function or action.

Accumulative patterns also allow for several **optimizations** to take place, for example when shuffling a list:
```isl
function shuffle(values: List<integer>, seed: integer): (suffledValues = values)
	for i in 1..values.length, rand in Random(seed)
		let randIndex = rand.range(i + 1, values.length)

		suffledValues = suffledValues with
			[i] = suffledValues[randIndex]
			[randIndex] = suffledValues[i]
```

Since `suffledValues` can only be read for the purpose of modifying itself, there is no need for the `with` operation to create a new copy of the list every time it is performed, and the intermediate results can be written in-place.

With a named return variable, a previous example can be made simpler:
```isl
function combinationsOf2(min: integer, max: integer): (result: List<(integer, integer)> = [])
	for x in min..max
		for y in min..max
			result += [(x, y)]
```

## List and stream comprehensions

**List comprehensions** allow building a list from `for`-like expressions.

```isl
let l = [(for i in 1..5) => i*i]
// l = [1, 4, 9, 16, 25]
```

A **filtering predicate** can also be added, using the `where` clause:
```isl
let l = [(for i in 1..5 where i mod 2 == 0) => i*i]
// l = [4, 16]
```

**Multiple streams** may be consumed concurrently, and each may have a different `where` clause:
```isl
let l = [(for i in 1..6 where i mod 2 == 0, j in 1..9 where j mod 3 == 0) => i + j]
// l = [5, 10, 15]
```

Like in `for` loops, consuming streams of **different lengths** would end whenever the shorter of them ends:
```isl
let l = [(for i in "a".."c", j in 1..6) => (i, j)]
// l = [("a", 1), ("b", 2), ("c", 3)]
```

Stream expressions can be **nested**, by successively passing the `=>` symbol through multiple streams. This allows to further simplify the implementation for the combination enumeration example mentioned earlier:
```isl
function combinationsOf2(min: integer, max: integer) =>
	[(for x in min..max) => (for y in min..max) => (x, y)]

print(combinationsOf2(0, 1)) // prints [(0, 0), (0, 1), (1, 0), (1, 1)]
```

Similarly to `for` loops, comprehensions may introduce variables and include `while` and `advance` clauses:
```isl
let sumsOfNaturalsUpTo5 = [(for i in 1..5, sum = 1 advance sum += i) => sum] // [1, 3, 6, 10, 15]
```

Comprehensions may be **accumulative**, and make use of the `initial` and `prior` keywords:

```isl
let sumsOfNaturalsUpTo5 = [(for initial = 1, i in 2..5) => prior + i]  // [1, 3, 6, 10, 15]
```

**Stream comprehensions** use identical syntax, excluding the brackets, but create a stream method instead:

```isl
let squaresOfEvenNumbers = (for i in 1..infinity where i mod 2 == 0) => i**2
// The type of squaresOfEvenNumbers is 'stream () => integer'

// (Note: since squaresOfEvenNumbers is a stream method with no parameters,
//  the for..in syntax allows it to be optionally invoked without the parentheses '()')
for n in squaresOfEvenNumbers
	print(n) // prints 4, 16, 36, 64, ....
```

Now the factorial example can be simplified to a simple two line function:
```isl
function factorial(num: 0..infinity)
	 let facSequence = (for initial = 1, i in 1..num) => prior * i
	 return facSequence().last
```

Here's the infamous "Fizz-Buzz" problem implemented using a stream comprehension and a `when` expression:
```isl
function divides(x, y) => x mod y == 0

stream fizzBuzz() =
	(for i in 1..infinity) =>
		when divides(i, 15): "FizzBuzz",
		when divides(i, 3): "Fizz",
		when divides(i, 5): "Buzz",
		otherwise: "{i}"
```

Here's a very simple recursive quicksort implementation using list comprehensions, pattern matching, and the spread operator:
```isl
function quicksort(match items: List<integer>)
	case [] => []
	otherwise
		let pivot = items[items.length / 2]
		let left = quicksort([(for x in items where x < pivot) => x])
		let right = quicksort([(for x in items where x >= pivot) => x])
		return [...left, ...right]
```

Here's a simple bounded sieve of Eratosthenes using a `for` loop and a list comprehension:
```isl
stream primesTo(max: integer)
	for n in 2..max, nonprimes: Set<integer> = {}
		if not nonprimes.includes(n)
			yield n

			let multiplesOfN = [(for initial = n**2 while prior < max) => prior + n]
			continue nonprimes = nonprimes.union(multiplesOfN)
```

Wouldn't it be nice to make an infinite-length (unbounded) stream which enumerates all prime numbers? This can be achieved by, for each prime encountered, storing a stream enumerating its multiples, and at each step incrementally advancing the collected streams as needed:
```isl
stream primes()
	// Generates the integer sequence n^2, n^2 + n, n^2 + n + n, n^2 + n + n + n, ...
	stream multiplesOfN(n: integer) =
		(for initial = n**2) => prior + n

	// For n in 2..infinity
	// At each step, advance each stream until a value greater than or equal to n is reached
	for n in 2..infinity, nonprimeStreams: List<Stream<integer>> = []
	advance nonprimeStreams = [(for i in nonprimeStreams) => i.skipUntil(num => num >= n)]

		// Search the stream object collection for an stream that reached exactly n
		if not nonprimeStreams.includes(nonprimeStream => nonprimeStream.value == n)
			// If none found then n is a prime - yield it
			yield n

			// Create a new (infinite-length) stream for the multiples of the prime just found
			// and add it to the collection
			continue nonprimeStreams += multiplesOfN(n)
```

List and stream comprehensions allow to easily implement common higher-order sequence processing functions like, `map`, `flatMap`, `filter`, `reduce` and `zip`, evaluated either eagerly (through list comprehensions) or lazily (through stream comprehensions). The generality of these operations requires type parameters, which would be introduced in a future chapter:
```isl
stream map<E, R>(valueStream: Stream<E>, transform: E => R) =
	(for e in valueStream) => transform(e)

stream flatMap<E, R>(valueStreams: Stream<Stream<E>>, transform: E => R) =
	(for e in ((for i in valueStreams) => i)) => transform(e)

stream filter<E>(valueStream: Stream<E>, filteringPredicate: E => boolean) =
	(for e in valueStream where filteringPredicate(e)) => e

stream zip<E1, E2>(stream1: Stream<E1>, stream2: Stream<E2>) =
	(for e1 in stream1, e2 in stream2) => (e1, e2)

stream accumulate<E, R>(valueStream: Stream<E>, accumulator: (R, E) => R, initialResult: R) =
	(for initial = initialResult, e in valueStream) => accumulator(e, prior)

stream reduce<E, R>(valueStream: Stream<E>, accumulator: (R, E) => R, initialResult: R) =>
	accumulate(valueStream, accumulator, initialResult).last
```

_Note the use of `=` and not `=>` when defining a method using a stream comprehension. Stream comprehensions are expressions that evaluate to stream methods, not values. We don't want a call to `map()` to return a method, but a stream object. Using the equals operation binds the parameters of the declared function into the comprehension, composing a new function, which returns a stream object when called._


## For-loops as methods

Like comprehensions, `for`-loops can also be converted to stand-alone methods:

So instead of:
```isl
function factorial(num: integer)
	for i in 1..num out result = 1
		continue result *= i

	return result
```

We can write:
```isl
function factorial(num: integer) = // Note the equals operator
	for i in 1..num out result = 1
		continue result *= i
```

Loop variables marked with `out` would be treated as return values. If there are more than one, they would be returned as a tuple, arranged by their order of declaration.

# Compound and polymorphic data types

## Classes and objects

A **class** is a template allowing the creation of object structures, which are also simply called **objects**:
```isl
class Person
	firstName: string
	lastName: string
	age: integer

// Shorter syntax:
class Person with firstName: string, lastName: string, age: integer
```

The `with` operator can be used to create a new object using the `Person` class as its template:
```isl
let andy = Person with firstName = "Andy", lastName = "Williams", Age = 19
```
A class may also be invoked like a constructor method, and would return a new object, whose fields receive the arguments passed to it, by their order of declaration:
```isl
let andy = Person("Andy", "Williams", 19)
```

One or more class fields may have default values:
```isl
class Person
	firstName = "Anonymous"
	lastName = ""
	age: integer
```

In addition to fields, classes may include functions, actions, computed fields, indexers and default streams:
```isl
class Person
	// Fields
	firstName: string
	lastName: string
	age: integer

	// Function (long syntax)
	function agePlusSomething(something: integer)
		return age + something

	// Function (short syntax)
	agePlusSomething(something: integer) => age + something

	// Action (long syntax)
	action printDescription()
		print(description)

	// Action (short syntax)
	action printDescription() => print(description)

	// Computed field (long syntax)
	computed description()
		return "{firstName} {lastName}, of {age} years of age"

	// Computed field (short syntax)
	description => "{firstName} {lastName}, of {age} years of age"

	// Indexer
	this[match index]
		case 0 => firstName
		case 1 => lastName

	// Default stream
	stream this()
		yield firstName
		yield lastName
```

Member usage examples:
```isl
let p = Person("Catherine", "Jones", 41)

p.agePlusSomething(5) // returns 46
p.printDescription() // prints "Catherine Jones, of 41 years of age"
p.description // returns "Catherine Jones, of 41 years of age"
p[1] // returns "Jones"

for m in p
	print(m) // prints "Catherine" "Jones"
```

A class method can use the `this` object and the `with` operator to create a altered copy of its containing object:
```isl
class Person
	firstName: string
	lastName: string
	age: integer

	getOlderPerson(yearsToAdd: integer) =>
		this with age += yearsToAdd
```

Alterations can be applied deeply into the object hierarchy:
```isl
class Group
	members: List<Person>
	sharedInterest: string

let golfers = Group with
	members = [Person("John", "Smith", 24), Person("Jane", "Doe", 42)]
	sharedInterest = "Golf"

let deeplyAlteredGroup = golfers with
	members[0].firstName = "Michael"
	members[1].age = 45
```

The `with` operator also allows for merging syntax on objects, the following is equivalent:
```isl
let deeplyAlteredGroup = golfers with { members: [{ firstName: "Michael" }, { age: 45 }] }
```

## Extension

**Extension** allows a new type to be built on the basis of an existing type.

Classes can only extend a single **base class**:
```isl
class Person
	firstName: string
	lastName: string
	age: integer

class PersonWithHeight extends Person
	height: decimal

// Shorter syntax:
class PersonWithHeight extends Person with height: decimal
```

Extending class can override one or more members of its base class:
```isl
class Person
	firstName: string
	lastName: string
	age: integer

	description => "{firstName} {lastName}, of {age} years of age"
	action printDescription() => print(description)

class PersonWithHeight extends Person
	height: decimal

	description => "{base.description} and {height} meters tall"

let james = PersonWithHeight("James", "Taylor", 19, 1.8)

james.printDescription() // Prints "James Taylor, of 19 years of age and 1.8 meters tall"
(james as Person).printDescription() // Prints "James Taylor, of 19 years of age"
```

If a class does not provide a body to one or more of its methods, it cannot be instantiated, however it can be used as a base class to a secondary class. This kind of class is called an **abstract class**:

```isl
abstract class AbstractPerson
	firstName: string
	lastName: string
	age: integer

	computed description()
	action printDescription()

class ConcretePerson extends AbstractPerson
	description => "{firstName} {lastName}, of {age} years of age"
	action printDescription() => print(description)
```

## Features

A **feature** (roughly resembling a **mixin** in other languages) is an abstract class-like type specifying a set of required members. Classes may extend any number of features. A feature may optionally provide **default implementations** or values for its members:

```isl
feature Labeled
	label: string
	action printLabel() => print(label)

class Employee extends Labeled
	fullName: string

action processLabeledObject(obj: Labeled)
	obj.printLabel()

let someEmployee = Employee with fullName = "John Doe", label = "abc123"

processLabeledObject() // prints "abc123"
```

Note that since the `label` field doesn't have a default value it must be explicitly assigned when the object is created. However, in order to initialize a new instance of `Employee` using the constructor syntax (`Employee(....)`) the value for the `label` field must be passed using a named argument, since it doesn't have an inherent order in relation to `Employee`'s own fields:

```isl
let someEmployee = Employee("John Doe", label = "abc123")
```
Default implementations will be overridden if they are implemented by the extending type:
```isl
class Employee extends Labeled
	fullName: string

	action printLabel() => print("Employee: {label}")

processLabeledObject(Employee("John Doe", label = "abc123")) // prints "Employee: abc123"
```

If several extended features have methods with **conflicting names or signatures**, the overriding method declaration may specify to which feature it relates to:
```isl
feature Runner
	action start(speed: decimal)

feature Processor
	action start(speed: decimal)

class Example extends Runner, Processor
	name: string

	action Runner.start(speed: decimal)
		....

	action Processor.start(speed: decimal)
		....
```

When a an method is overridden in this way, it is not possible to directly call it through the extending class:

```isl
let test = Example("New Example")

test.start(15) // Which of the two actions should be invoked?
```
Instead, a specific implementation can be invoked by casting the object to one of the feature types:
```isl
(test as Processor).start(15)
```

When a similar conflict occurs between two or more fields, it can be resolved in an analogous way:

```isl
feature FeatureA
	index: integer

feature FeatureB
	index: string

class ExampleClass extends FeatureA, FeatureB
	name: string

	// 'Example' has no field named 'index', instead it has:
	FeatureA.index = 10 // default value for FeatureA field
	FeatureB.index = "10" // default value for FeatureB field
```

Initialization must prefix the field name with the feature it relates to:
```isl
let test = ExampleClass("Something", FeatureA.index = 20, FeatureB.index = "20")
```

A secondary approach is to introduce an additional field and define the two feature's fields as computed fields that "route" back to it:

```isl
class ExampleClass extends FeatureA, FeatureB
	name: string

	index: integer = 10

	FeatureA.index => index
	FeatureB.index => index.toString()
```

Now the object can be instantiated normally using the constructor syntax:
```isl
let test = ExampleClass("Something", 20)
```

Features may **extend any number of other features**. A feature may override one or more of its base feature's members. When a feature extends two or more features with conflicting member names, the resolution can be done with a similar approach to the one described above:
```isl
feature Runner
	action start(speed: decimal)
		....

feature Processor
	action start(speed: decimal)
		....

feature ExampleFeature extends Runner, Processor
	name: string

	action Runner.start(speed: decimal)
		....

	action Processor.start(speed: decimal)
		....
```
In this case, this means that `ExampleFeature` doesn't have its own `start` method. Instead it  modified the default implementations for members of the features it inherited from such that a class which extends `ExampleFeature` will have different default behaviors when it is cast to `Runner` or `Processor`:

```isl
class ExampleClass extends ExampleFeature

let x = ExampleClass("Test")

(x as Runner).start(13)
// The invoked implementation of `start` is the one overriden by ExampleFeature,
// not the original one specified in `Runner`.
```


## Anonymous structures

A **structure** is a simple object-like container, analogous to a dictionary with a fixed set of predefined fields and member types:
```isl
let myStructure = { url: "https://example.com", speed: 9000 }
```

 **Anonymous structure types** are types that describe a set of required object fields. For example, here's a function that would accept any object-like entity with the fields `url: string` and `speed: integer`
```isl
function giveMeSomeStructure(s: { url: string, speed: integer })
	....

giveMeSomeStructure(myStructure)
```

An anonymous structure type is different from dictionary or a tuple with named members by the fact that it can structurally match any class or feature with compatible member names and types. This kind of subtyping may be described as a weak form of **duck typing**:
```isl
class SomeClass
	name: string
	url: string
	speed: integer
	weight: decimal

	....

let instanceOfSomeClass = SomeClass("SomeName", "https://example.com", 10000, 125.5)

giveMeSomeStructure(instanceOfSomeClass)
// This call compiles since SomeClass is assignable to the anonymous structure type
// { url: string, speed: integer }
```

**Structure fields can be added and removed** in an ad-hoc fashion, such that its type signature changes accordingly:

```isl
let s1 = { a: 1, b: false } // type of s1 is { a: integer, b: boolean }
let s2 = s1 with c: string = "Hi" // type of s2 is { a: integer, b: boolean, c: string }
let s3 = s2 with no b // type of s3 is { a: integer, c: string }

// Note that if the assigned values are constants, like in the above example,
// the inferred types will be narrowed further via refinement typing:
// For example, the type of s1 will actually be narrowed to { a: 1, b: false }
// where '1' and 'false' are literal types.
```

This behavior doesn't imply dynamic typing. Whenever a value is altered in this way, its new type is statically inferred during compile-time. There is no runtime type management involved.

**Structure fields may be set to computed values**:

```isl
let s1 = { a: 1, b: false, c => when b is true: a + 1, otherwise: a - 1 }
```
The computed (or "lazy") nature of `c` is not reflected in the type - the type of `s1` is nonetheless inferred as `{ a: integer, b: boolean, c: integer }`. Since structures are always read-only, it doesn't really matter whether a value is memorized or computed via a function.

## Type companion objects

**Type companion objects** (which may also be described as dedicated **static member structures**) are special objects that may share the same name as a class (or act as **singleton objects**). They are used to provide data and functionality that are not associated with a particular instance of a class:

```isl
class Vector2
	x: decimal
	y: decimal

object Vector2
	zero = Vector2(0, 0)

	distance(a: Vector2, b: Vector2) =>
		sqrt((a.x - b.x)**2 + (a.y - b.y)**2)

let z = Vector2.zero // z = (0, 0)
let d = Vector2.distance(Vector2(1, 3), Vector2(-5, 9)) // d = 8.485
```

**Operators** are functions using symbols as a calling mechanism. Operators can only be defined on type companions:
```isl
class Point
	x: decimal
	y: decimal

object Point
	operator +(a: Point, b: Point) => Point(a.x + b.x, a.y + b.y)
	operator -(a: Point, b: Point) => Point(a.x - b.x, a.y - b.y)
	operator -(a: Point) => Point(-a.x, -b.y)

let sumOfPoints = Point(1, 4) + Point(-2, 5)
// sumOfPoints equals Point(-1, 9)

let differenceOfPoints = Point(7, 4) - Point(2, 3)
// differenceOfPoints equals Point(5, 1)
```

## Type features

A **type feature** (also known as a **type class** in other languages) is a feature consisting only of type object members and operators and which consequently abstracts over different **types** (rather than instances of types). For example, a feature abstracting over all types supporting the `==` operator would be defined as:

```isl
type feature Equatable<T>
	operator ==(x: T, y: T): boolean
```

In the following example, both `Point` and `Person` implement the `Equatable` feature:

```isl
class Point
	x: decimal
	y: decimal

object Point extends Equatable<Point>
	operator ==(a: Point, b: Point) =>
		(a.x, a.y) == (b.x, b.y)

class Person
	fullName: string
	age: integer

object Person extends Equatable<Person>
	operator ==(a: Person, b: Person) =>
		(a.fullName, a.age) == (b.fullName, b.age)

function areEqual<T extends Equatable<T>>(a: T, b: T) => a == b

print(areEqual(Point(1, 2), Point(1, 2))) // prints "true"
print(areEqual(Person("John Doe", 24), Person("John Doe", 24))) // prints "true"
print(areEqual(Point(1, 2), Person("John Doe", 24))) // Error: couldn't find a type for T
```

Here's a monoid type feature (representing an associative binary operation with identity element):
```isl
type feature Monoid
	operator +(x: this, y: this): this
	identity: this
```
_(Note the `this` type would contextually refer to the concrete type of the object implementing the feature, not to the `Monoid` abstraction)_

Multiple type features used as constraints:
```isl
function propertyOf3Sums<T extends Monoid and Equatable>(a: T, b: T, c: T): boolean =>
	((a + b) == T.identity) and ((b + c) != T.identity)
```

Using a type alias and a join type we can define a type that **combines both instance and type members**:

```isl
feature Person
	firstName: string
	lastName: string

type feature Equatable
	operator ==(x: this, y: this): boolean

type EquatablePerson = Equatable and Person
```

## Expansion

**Expansion** introduces new members to an existing class, feature or type object, and can be performed any number of times:
```isl
class Person
	firstName: string
	lastName: string
	age: integer

class expansion Person
	fullname => "{firstName} {lastName}"

object Person
	anonymous = Person("Anonymous", "", 0)
	haveSameFirstName(p1: Person, p2: Person) => p1.firstName == p2.firstName

object expansion Person
	operator ==(a: Person, b: Person) =>
		(a.firstName, a.lastName, a.age) == (b.firstName, b.lastName, b.age)
```

Expansion can add any member kind apart from instance fields (though it can add type object fields):
```isl
class Person
	firstName: string
	lastName: string
	age: integer

class expansion Person
	favoriteNumber: integer // ERROR: This will not work

object Person
	andy = Person("Andy", "Jones", 22)

object expansion Person
	angela = Person("Anegla", "Jones", 25) // But this will work

object expansion Person
	ben = Person("Ben", "Smith", 23) // And so will this
```

Class expansions can **extend features**, as well as override their default implementations:
```isl
class Employee
	fullName: string

feature Labeled
	label: string
	action printLabel() => print(label)

class expansion Employee extends Labeled
	label => fullName
	action printLabel() => print("Great Employee: {label}")
```

Expansions can **add members to features**, as long as they provide default values or implementations:
```isl
feature Labeled
	label: string
	action printLabel() => print(label)

feature expansion Labeled
	reversedLabel => label.reversed
```

Expansions are designed such that they never change the behavior of code outside of their own scope. This is ensured by several **precedence rules**.

For class or type object members added through an expansion:
```text
overriden members > feature default implementations > expansion members
```

For feature members added through an expansion:
```text
any feature members with same name and signature (including in features other than the expanded one) > feature expansion members
```

This means that if `X` and `Y` are features, and `Z` extends both `X` and `Y`, and `X` is expanded with a method that also exists in `Y`, `X`'s expansion will be shadowed by `Y`'s implementation:
```isl
feature X
	someField: string

feature expansion X
	someFunction() => "X!"

feature Y
	someFunction() => "Y!"

feature Z extends X, Y

function test(z: Z)
	return z.someFunction() // There is no conflict here, this is will always return "Y!"
```

## Generics

**Generic typing** (also known as **parametric polymorphism**) allows types and methods to refer to unknown, or partially known, types, which can vary and are determined individually at each class instantiation or method call.

A **type parameter** is introduced using the `<T>` notation:

```isl
class Pair<T>
	a: T
	b: T
```

The unknown type parameter (named `T` in this example) can accept any type:
```isl
let pairOfIntegers = Pair<integer>(1, 2)
let pairOfstrings = Pair<string>("a", "b")
let pairOfBooleans = Pair<boolean>(true, false)
```

Including the `Pair` type itself:
```isl
let pairOfPairs = Pair<Pair<string>>(Pair<string>("a", "b"), Pair<string>("c","d"))
```

The type argument e.g. `<integer>` is not required if it **can be inferred** from the constructor arguments, this simplifies the above to:

```isl
let pairOfIntegers = Pair(1, 2)
let pairOfstrings = Pair("a", "b")
let pairOfBooleans = Pair(true, false)
let pairOfPairs = Pair(Pair("a", "b"), Pair("c","d"))
```

_(Note: Unlike C#, Java, TypeScript, and several other languages, the Island language does not allow both generic and non-generic types sharing a common identifier. This enables to safely omit the type argument with no chance of ambiguity)_

Methods can accept and infer type arguments as well:
```isl
function firstOfPair<A>(p: Pair<A>) => p.a

let firstInteger = firstOfPair(Pair(1, 2)) // returns 1
let firststring = firstOfPair(Pair("a", "b")) // returns a
```

Type parameters can have **constraints**, which enforce a minimum assignability requirement:
```isl
feature Named
	name: string

class Person extends Named
	age: integer

function loveAffair<T extends Named>(a: T, b: T) =>
	"{a.name} loves {b.name}"

let l = loveAffair(Person("Angela", 21), Person("Mike", 20))
// l = "Angela loves Mike"
```

Note that applying a type as a constraint is subtly different than specifying the type directly, especially in the case where the type parameter is used in multiple places:

```isl
class Fruit extends Named
	name: string
	weight: decimal

let l = loveAffair(Person("Angela", 21), Fruit("Apple", 1.5)) // Error! could not find a binding for type parameter T.
```

Even though both the types `Person` and `Fruit` satisfy the `Named` feature, the `T` type parameter can only be instantiated by a single type, therefore a compilation error is emitted.

Alternatively, if the `Named` feature was used directly as `a` and `b`'s parameter types, the code would compile successfully:

```isl
function loveAffair2(a: Named, b: Named) =>
	"{a.name} loves {b.name}"

let l = loveAffair2(Person("Angela", 21), Fruit("Apple", 1.5)) // Works!
// l = "Angela loves Apple"
```

**Multiple constraints** may be applied to a type parameter:
```isl
feature Printable
	action printMe()

class Fruit extends Named, Printable
	name: string
	weight: decimal

	action printMe() => print("A {a.name} weighing {weight}kg")

action printNamedThing<T extends Named and Printable>(a: T) => a.printMe()

printNamedThing(Fruit("Banana", 0.5)) // prints "A Banana weighing 0.5kg"
```

Type parameters can have **default values**:
```isl
function MakePair<T = integer>(v1: T, v2: T): (T, T)
	....
```

Island supports **implicit type parameters**, meaning that generic types referenced without the introduction of type parameters will accept any type argument, given it satisfies their constraint set:

```isl
function firstsOfPairs(p1: Pair, p2: Pair) =>
	(p1.a, p2.a)
```
which would be roughly equivalent to:
```isl
function firstsOfPairs<A, B>(p1: Pair<A>, p2: Pair<B>): (A, B) =>
	(p1.a, p2.a)
```

`p1` and `p2` can accept any instances of `Pair`, including ones with incompatible types:
```isl
let r = firstsOfPairs(Pair(1, 2), Pair('a', 'b')) // r = (1, 'a')
```

This is not always desirable. In case `p1` and `p2` are expected to have compatible instantiations of `Pair`, a type parameter must be introduced:

```isl
function firstsOfPairs<T>(p1: Pair<T>, p2: Pair<T>) => (p1.a, p2.a)

let r = firstsOfPairs(Pair(1, 2), Pair('a', 'b')) // Error: p1 and p2 must have compatible types!
```

Type associations may be defined ad-hoc, such that they only describe relationships between different polymorphic entities, but are not actually exposed as parameters. This kind of typing is called **existential typing**:

```isl
function firstsOfPairs(p1: Pair<any E>, p2: Pair<any E>) => (p1.a, p2.a)
```
This means that `p1` and `p2` must have a compatible type instantiation (which is "code-named" `E`). However, an assignment for `E` cannot be explicitly specified when `firstOfPairs` is invoked.


## Polymorphic subtyping rules (covariance and contravariance)

When assigning a value to a plain variable of a given type, the value would be assignable to it only if the target type is identical to, or more general than the type of the value:

```isl
let a1: Animal = Animal() // Works: identical types
let a2: Animal = 34 // Doesn't work: unrelated types
let a3: Animal = Cat() // Works: target type is more general than assigned value type
let a4: Cat = Animal() // Doesn't work: target type is more specific than assigned value type
```

It may seem, at first, like this is the only manner in which types can relate to each other: after all, it doesn't make sense that an any `Animal` type would substitute a `Cat` type. However, there are cases where this is exactly what happens!

Here are two function types, one accepting an `Animal` parameter type, the other a `Cat` parameter type:
```isl
type GiveMeAnimal = (Animal) => string
type GiveMeCat = (Cat) => string

```

Now ponder this carefully: do you think that `GiveMeCat` should assign to `GiveMeAnimal`? `GiveMeAnimal` should assign to `GiveMeCat`? or maybe both should assign to each other? or neither one to any?

Let's go through it again:

* The type `GiveMeCat` describes a function that accepts a `Cat` object, and returns a string.
* The type `GiveMeAnimal` describes a function that accepts an `Animal` object, and returns a string.

`GiveMeAnimal` is more permissive, it will accept any animal, however `GiveMeCat` is more strict, and will only accept a cat.

If you attempted to assign a function of type `GiveMeCat` to a variable of type `GiveMeAnimal` you'd take a strict function and put in a placeholder designated for a more permissive function:
```isl
let giveMeAnimal: (Animal) => string

giveMeAnimal = (Cat) => "Hello cat!"

// Because 'giveMeAnimal' accepts any animal, passing a dog as argument should work,
// but would it make any sense?
let str = giveMeAnimal(Dog()) // Would return "Hello cat!" ??!!
```

However, if you assigned `GiveMeAnimal` to `GiveMeCat`, it would, surprisingly, make more sense:
```isl
let giveMeCat: (Cat) => string

giveMeCat = (Animal) => "Hello animal!" // Seems to work, but why?
```

This phenomenon is called **contravariance** (substitution of general with specific) and the more "intuitive" substitution rule, mentioned in the context of plain variables, is called **covariance** (substitution of specific with general).

It turns out that when thinking about functions: return types ("out" positions) are covariant, however, parameter types ("in" positions) are contravariant.

Sometimes we may wish to constrain type parameters so that they can only be used in one of these positions. This is possible with the `in` and `out` modifiers:

```isl
class LookupTable<in K, out V>
	function getValue(key: K): V
```

## Fixed fields and partially constructed objects

Consider this definition of the `Person` class :
```isl
class Person
	enumeration Gender with Male, Female

	firstName: string
	lastName: string
	gender: Gender
	age: integer

	titleAndLastName => "{when gender == Gender.Male: "Mr.", otherwise: "Ms."} {lastName}"

	fullName => "{firstName} {lastName}"

	fullNameAndAge => "{fullName}, of {age} years of age"
```

Say we wanted to derive a class for a person who must be male and whose last name must be "Smith". In the traditional object-oriented style this can be done by extending `Person` and fixing the `lastName` and `gender` fields to the constant values `"Smith"` and `Male`:
```isl
class MrSmith extends Person
	final lastName = "Smith"
	final gender = Gender.Male
```

A major limitation of this approach is that it can only work with values that are known at compile-time. What if we wanted to "partially apply" the `Person` class with some arbitrary values for `lastName` and `gender` that are only known at run-time?

This can be done using the `with` operator:
```isl
let mrSmith = Person with lastName = "Smith", gender = Gender.Male
```

Because some of `mrSmith`'s fields (namely `firstName` and `age`) are missing (and don't have default values), a full instance of `Person` could not be constructed. Instead, the resulting value - `mrSmith` is not an object of type `Person`, but of the type `partial Person with lastName, gender`.

Wouldn't it be nice if we could call some of the partially constructed object's methods? Unfortunately since these methods access the `this` object (either implicitly or explicitly), they don't provide any formal guarantees they wouldn't attempt to access uninitialized fields. In the special case the methods never pass the `this` object to an external method, the requirements of each method can be determined automatically:

```isl
class Person
	....

	titleAndLastName => "{when gender == Gender.Male: "Mr.", otherwise: "Ms."} {lastName}"

	fullName => "{firstName} {lastName}"

	fullNameAndAge => "{fullName}, of {age} years of age"
```

The computed field `titleAndLastName` can be called for `mrSmith`:
```isl
print(mrSmith.titleAndLastName) // prints "Mr. Smith"
```

However trying to reference `fullName` would result in a compilation error, since it requires `firstName` to be initialized:
```isl
print(mrSmith.fullName) // Error: `fullName` uses member `firstName`, which is not defined for type `partial Person with lastName, gender`
```

In case a member passes the `this` object explicitly, the receiving function must annotate its parameter with a compatible `partial` type:
```isl
function giveMePartialPerson(p: partial Person with gender, lastName)
	....

class Person
	....

	somethingElse => giveMePartialPerson(this)
```

We could continue adding more information to the object:
```isl
let mrJohnSmith = mrSmith with firstName = "John"

print(mrJohnSmith.fullName) // prints "John Smith"
print(mrJohnSmith.fullNameAndAge) // Error! fullNameAndAge uses member `age`, which is not defined for type `partial Person with firstName, lastName, gender`
```

Finally, when we add a value for `age`, the object becomes fully constructed:
```isl
let mrJohnSmith28 = mrJohnSmith with age = 28
// mrJohnSmith28 finally receives the type `Person`

print(mrJohnSmith28.fullNameAndAge) // prints "John Smith, of 28 years of age"
```

An alternative, but more limited, way to achieve a similar effect is to partially apply the constructor call:

```isl
class Point
	x: decimal
	y: decimal

let pointWhereXEquals1 = Point(1, ...)
// The type of pointWhereXEquals1 is `partial Point with x`
```

Here's a more realistic use case.

Say we had an object representing a database, and that has the fields `connection` and `name`:
```isl
class Database
	connection: ServerConnection
	name: string

	action query(this, sql: string)
		....

	action verifyConnection({ connection }: this)
		connection.verify(....)
```

For every new database object we wanted to create, we'd have to re-specify which server connection it uses:
```isl
let myConnection = connectServer("localhost:5555", "admin", "1234")

let db1 = Database with connection = myConnection, name = "DB1"
let db2 = Database with connection = myConnection, name = "DB2"
let db3 = Database with connection = myConnection, name = "DB3"
```

With a partially constructed object, the `connection` field can be fixed once and then the resulting object reused:
```isl
let myConnection = connectServer("localhost:5555", "admin", "1234")

let databaseWithMyConnection = Database with connection = myConnection
// The type of `databaseWithMyConnection` is `partial Database with connection`

databaseWithMyConnection.verifyConnection() // Works!

let db1 = databaseWithMyConnection with name = "DB1"
let db2 = databaseWithMyConnection with name = "DB2"
let db3 = databaseWithMyConnection with name = "DB3"
```

In case some fields have default values but the desired behavior is to have those fields undefined on the partial object, their default values **can be "erased"** by explicitly applying the `no` modifier within the `with` expression:

```isl
class Person
	firstName: string
	lastName: string
	planetResidence = "Earth"

let angelaFromUnknownPlanet = Person with firstName = "Angela", no planetResidence
```

**Features can be partial** as well, however since features cannot be instantiated directly the `partial` type modifier is only effectively usable for specifying a subset of a feature's fields that are expected to be known. For instance:

```isl
feature Named
	name: string
	alias: string
	id: string

action printThingName(thing: partial Named with name, id)
	print("Name: {thing.name}, Id: {thing.id}")
````

# Concurrency, parallelism and lazy evaluation

## Computed variables and values

Remember computed fields in a class?
```isl
class Person
	firstName: string
	lastName: string
	fullName => "{firstName} {lastName}"
```

`fullName` is only evaluated when it is called (and possibly the result is then stored for subsequent calls).

Using a computed variable, we could make a local variable that behaves in a similar way:
```isl
let x = 1
let y = 2
let z => x + y // The type of z is a plain integer

print(z) // prints 3
```

`z` is a variable bound to a value of type `integer`, but its value would only be calculated when it is first used.

With this approach, however, `z` will lose its `computed` characteristic when it is passed to a method:
```isl
function makePair(value1, value2) => (value1, value2)

let x = 1
let y = 2
let z => x + y

let w = makePair(z, 5) // z will be evaluated before makePair is called
// w is equal to (3, 5)
```

A second approach would be define the value itself (not the variable) as computed:
```isl
function makePair(value1: integer, value2: integer) => (value1, value2)

let x = 1
let y = 2
let z = compute x + y
// `z` still has the plain type `integer`
// The 'computed' characteristic is only tracked internally, in the runtime

let w = makePair(z, 5) // z will not be evaluated here
// w has the value (compute 1 + 2, 5)

let v = w[1] + 1 // `compute 1 + 2` is finally evaluated to 3 and v gets the value 4
```

This behavior is called **lazy evaluation**. We can postpone the evaluation of `compute 1 + 2` only to the point where it is actually needed. It can be passed to methods or stored in variables and objects, but will only be evaluated when it is a part of a complex expression that is immediately (eagerly) evaluated.

Computed values can be **composed** together:
```isl
let x = 1
let y = 2
let z = compute x + y
let s = compute sqrt(z) // z is not evaluated but composed with the computation `sqrt(....)`
// s now equals `compute sqrt(1 + 2)`
```

Note that just like computed fields, computed variables and values cannot have side-effects therefore cannot include calls to actions or action streams.

## Concurrent and parallel execution with the `spawn` keyword

When then `spawn` keyword is added to a method call, the method is immediately executed in a separate thread. When the returned value of the spawned method is first read, execution may block if the method had not yet completed:

```isl
function heavyCalculation()
	// ....

	return result

let x = spawn heavyCalculation() // The function heavyCalculations() starts on a seperate thread
let y = somethingUnrelated(....) // This will execute even if heavyCalculations() has not completed
let z = x + y // This may block until heavyCalculations() returns and x receives a value
```

**Multiple methods** may be spawned at the same time:
```isl
let (r1, r2) = spawn (heavyCalculation1(), heavyCalculation2())
let a = r1 + 1 // Will block until r1 received a value and exeute even if r2 hasn't yet
let b = r2 + 1 // Blocks until r2 receives a value
```

The `wait` statement can be used to explicitly wait for a particular value to become available:
```isl
let (r1, r2) = spawn (heavyCalculation1(), heavyCalculation2())
wait r2
```

For convenience, the `wait` keyword can also be used as a modifier. The following is equivalent:
```isl
let (r1, wait r2) = spawn (heavyCalculation1(), heavyCalculation2())
```

As demonstrated, applying `spawn` to a simple function call, it is possible to compute an **individual value** in the background. Using streams, it is also possible to instead compute a **sequence of values** in background.

This will evaluate a stream method in a background thread and save the yielded values to disk as soon as they arrive:
```isl
stream heavyCalculations()
	for ....
		....
		yield result

for result in spawn heavyCalculations()
	somethingUnrelated(....) // This will execute even if 'result' has not yet received a value
	writeToDisk(result) // This will block until 'result' receives a value
```

Analogously to the single-value approach, we can spawn multiple streams and iterate both of them at the same time:
```isl
for (result1, result2) in spawn (heavyCalculations1(), heavyCalculations2())
	writeToDisk(result1) // This will block until result1 receives a value, and will execute even if result2 didn't
	writeToDisk(result2) // This will block until result2 receives a value
```

Sometimes the lazy behavior isn't desirable, and it is preferred to wait until one or all of the streams produce a value before the body of the loop is entered. The `wait` keyword will cause execution to block until the reference variable(s) receive a value.

```isl
for (result1, result2) in spawn (heavyCalculations1(), heavyCalculations2())
	wait result1, result2
	print("Congratulations, we have new results!") // This will only execute when both result1 and result receive a value
	....
```

For convenience, the `wait` keyword can also be integrated as a modifier to the loop variable:
```isl
for (wait result1, wait result2) in spawn (heavyCalculations1(), heavyCalculations2())
	print("Congratulations, we have new results!") // This will only execute when both result1 and result receive a value
	....
```

Sometimes we want to allow for results to evaluate as soon as any one of several computations yields a value. By adding the `any` modifier to the variable, a single result is received whenever any one of the streams yields a value.

```isl
// Note both streams should have compatible return types,
// otherwise 'result' will receive a choice type (introduced at later chapter)
for wait any result in spawn (heavyCalculations1(), heavyCalculations2())
	writeToDisk(result)
```

A similar approach can be used to simultaneously listen to multiple event sources:
```isl
// Note that modifying 'event' with the `match` keyword here would automatically wait until a result arrives.
// No need to specify `wait match`:
for match any event in spawn (keyboardEvents(), mouseEvents())
	case KeyboardEvent
		print("Keyboard event!")
	case MouseEvent
		print("Mouse event!")
```

In a real-world application, however, it is more likely that event sources would require being dynamically subscribed and unsubscribed from throughout the program runtime. This can be achieved by applying `spawn` to a collection (in this example a dictionary) and altering the collection in progressive iterations of the loop:

```isl
for eventSources = { "kEvents": keyboardEvents() }, match any event in spawn eventSources
	case KeyboardEvent
		print("Keyboard event!")
		print("Now listening to mouse events instead!")

		continue eventSources with
			no ["kEvents"]
			["mEvents"] = mouseEvents()

	case MouseEvent
		print("Mouse event!")
```

The `spawn` keyword can also be used in stream and list comprehensions.

This will define a stream method that computes an unbounded series of primes in the background:

```isl
let backgroundPrimes = (for p in spawn calculatePrimes()) => p
```

## Automatic parallelization via implicit spawning

In the case of `function`s and plain (pure) `stream`s (i.e. non-`action stream`s), spawning may be done automatically, without any need for explicit annotation in the code, since execution of these methods does not carry any impact beyond the scope of their own running context.

This means that normal code may be internally transformed during compilation to include `spawn` modifiers based on the compiler's own judgement. For example:

```isl
let x = someFunction(....)
let y = anotherFunction(....)

for a in somePureStream()
	....
```

May be automatically transformed to:
```isl
let x = spawn someFunction(....)
let y = spawn anotherFunction(....)

for a in spawn somePureStream()
	....
```

In the case of a pure (functional) stream, the compiler may also choose to precompute one or more future elements ahead of time (that is, in parallel to the execution of the loop body), since doing so would have no impact on the program's behavior (aside form slightly increased memory use).

# Contracts

## Contracts

The `assert` statement can evaluate arbitrary assertions. It is evaluated both during compile-time and run-time, as needed.

```isl
function divide(a: decimal, b: decimal)
	assert b != 0
	return a / b

let r1 = divide(10, 0) // compiler error

let x = 0
let r2 = divide(10, x) // compiler error

let y = 2
let r2 = divide(10, y - 2) // compiler error
```

It can be positioned anywhere, including in the global scope:
```isl
let z = x + y
assert z > 5
```

It can include function calls (but not action calls)
```isl
function notZero(x) => x != 0

function divide(a: decimal, b: decimal)
	assert notZero(b)
	return a / b
```

It can reference the returned value as well (these types of assertions would always be evaluated after the function has returned):
```isl
function doSomeMath(x: decimal): (result: decimal)
	assert result > x
	....
```

The immutability property could potentially ease the analysis of more complex scenarios at compile-time, using a more advanced theorem prover:
```isl
function someMath1(x: decimal): (result: decimal)
	assert result > 5
	....

function someMath2(a: decimal, b: decimal)
	assert b >= 0
	assert a + b < 5
	....

let r1 = someMath1(???) // r1 is always greater than 5, regardless of argument passed to `someMath1`
let r2 = someMath2(r1, ???) // Compiler error regardless of the value of r1 and the second argument
```

# Type abstractions

## Refinement and assertion types

**Refinement types** can be seen as simple contracts annotated into the type itself:

The following two function declarations are practically equivalent:
```isl
function someMath1(x: decimal): (result: decimal)
	assert x >= -4.0 and x <= 4.0
	assert result >= 16.0
	....
```

```isl
function someMath1(x: -4.0..4.0): 16.0..infinity
	....
```

Since Island values and variables are strictly read-only after initialization, only one assertion check is needed to ensure the validity of a contract throughout the lifetime of the object and its binding variable. Types of operations between refined types can be inferred during compile-time (if feasible):

```isl
let x: 0..10
let y: -5..0
let z = x * y // z's type is -50..0
```

Refinement types can include more complex Boolean expressions:

```isl
function someMath2(x: -4..4 or 10..20): -16..16 and not 0
	....
```

Refinement types can apply to strings, using regular expressions:
```isl
function properIdentifiersOnly(id: /[a..zA..Z]+/)
	....
```

More complex assertions can be included in a type by referencing a **predicate function**, which must accept a single argument and a return type of `boolean`. These kinds of types are called **assertion types**.

Assertion types, for the most part, cannot be checked during compile-time and would require a run-time call each time a variable of the type is initialized. The predicate's parameter type (which can be any type, including a refinement type) would be used to determine the base underlying type used at compile-time:

```isl
predicate MultipleOf10(x: integer) => x mod 10 == 0

function something(x: MultipleOf10)
	....
```

Like any other method, assertion types can accept type arguments:
```isl
predicate ShortList<T>(list: List<T>) => list.Length < 100

function something(x: ShortList<string>)
	....
```

A less powerful, but more concise way to define assertion types employs the `where` clause, used similarly to the `match` predicate syntax:

```isl
function something(x: integer where x mod 10 == 0): (result: integer where result mod 2 == 0)
	....
```

These capabilities enable overload resolution to include rudimentary `match`-like predicates:
```isl
action processSomething(category: "Animal", isMammal: true, owner: Person where age >= 18)
	print("Hello animal lover!")

action processSomething(category: "Animal", isMammal: false, owner: Person where age < 18)
	print("Hello young animal lover!")

action processSomething(category: "Person", id: /[a..zA..Z]+/)
	print("Hello random person!")
```

Using the compact overloading syntax would resemble more of the `match`/`case` structure. The following is semantically equivalent:
```isl
action processSomething
	(category: "animal", isMammal: true, owner: Person where age >= 18)
		print("Hello animal lover!")

	(category: "animal", isMammal: false, owner: Person where age < 18)
		print("Hello young animal lover!")

	(category: "person", id: /[a..zA..Z]+/)
		print("Hello random person!")
```

However, note that unlike `match` statements, overloading assumes the given argument set must satisfy one of the overloads, thus an analogous `otherwise` fallback is not needed. In case of a matching failure not caught during compile-time, a run-time error would be thrown.

Here's recursive Fibonacci implemented using overloading and refinement types:
```isl
function fibonacci
	(num: 1) => 0
	(num: 2) => 1
	(num: 3..infinity) => fibonacci(num - 1) + fibonacci(num - 2)
```

Passing a number smaller than 1, e.g. `fibonacci(0)` would cause a runtime error (alternatively an overload like `(num: integer where num < 1) => throw ....` could be added to provide more specialized error handling).

Compare with a single function matching over `num` as a parameter:
```isl
function fibonacci(match num)
	case 1 => 0
	case 2 => 1
	case _ > 3 => fibonacci(num - 1) + fibonacci(num - 2)
```

Passing `fibonacci(0)`, would cause a compile-time error.

Also note that in both approaches, calling:
```isl
let result = fibonacci(2)
```
Would cause `result` to have the literal type `1` as the return value could be inferred at compile-time.

Simple literal types like `"Animal"`, `5` or `true` can alternatively be stated without an identifier:

This would further simplify a previous example to:
```isl
action processSomething
	("animal", true, owner: Person where age >= 18)
		print("Hello animal lover!")

	("animal", false, owner: Person where age < 18)
		print("Hello young animal lover!")

	("person", id: /[a..zA..Z]+/)
		print("Hello random person!")
```

Having no identifiers, the first two parameters can still accept named arguments by being referenced by their index:

```isl
processSomething([1]: false, owner: Person("Lea","Johnson", 16), [0]: "Animal")
// prints "Hello young animal lover!"
```

## Type aliases

A **type alias** defines a new name for a type expression.

```isl
type MyDictionary = Dictionary<string, (string, integer)>
```

It may include type parameters:
```isl
type MyDictionary<T, U> = Dictionary<T, (T, U)>
```

By default, type aliases are **structural**, meaning differently named type aliases representing equivalent types are interchangeable with each other.

This is not always desirable, say, when aliasing the `decimal` type to represent different currencies:
```isl
type Dollars = decimal
type Euros = decimal

function iWantDollars(money: Dollars)
	....

let euros: Euros = 45.0
iWantDollars(euros) // No error!
```

To ensure `Dollars` and `Euros` would not be interchangeable with each other one can add the `unique` modifier. This would define the aliases as **nominal** (unique) types:
```isl
unique type Dollars = decimal
unique type Euros = decimal

function iWantDollars(money: Dollars)
	....

let euros: Euros = 45.0 as Euros // Explicit cast needed here
iWantDollars(euros) // Error! incompatible types
```

## Choice types

A **choice type** (also called a **union** or a **sum type**) defines a type that may hold one of several different types:

```isl
type IntegerOrString = integer or string
```

Choice types can disambiguated at runtime, using a type assertion:
```isl
let x: IntegerOrString = 3

if x is integer
	print("integer!")
else if x is string
	print("string!")
```

Or using pattern matching:
```isl
let x: IntegerOrString = 3

match x
	case integer
		print("integer!")
	case string
		print("string!")
```

Choice types may **include any type**, including primitives, templates, features, other choice types or even refinement types:
```isl
type CanBeManyThings = integer or decimal or List<integer> or Cat or (string or boolean) or 0..10
```

Like any type alias, choice types may **include type parameters**:
```isl
type AnyCollection<T> = List<T> or Dictionary<string, T> or Set<T>
```

Choice types may be **self-referencing**, which allows modeling complex recursive structures like a binary tree:
```isl
unique type BinaryTree<V> = V or (leftNode: BinaryTree<V>?, rightNode: BinaryTree<V>?)
```

## Variant types

In the final example of the previous section we've used a choice type to define a binary tree type:

```isl
unique type BinaryTree<V> = V or (leftNode: BinaryTree<V>?, rightNode: BinaryTree<V>?)
```

One issue with this approach is that pattern matching to discriminate between a leaf and internal node is rather involved and error prone:
```isl
function leafOrInternal<T>(match tree: BinaryTree<T>)
	case T
		return "leaf!"

	case (BinaryTree<T>?, BinaryTree<T>?)
		return "internal!"
```

Wouldn't it be nicer if we could give those two possibilities names, to ease on pattern matching? It would be also nice to declare the type in a more organized way.

This is possible with variant types. A **variant type** (also called a **tagged union**) is a unique (nominal) choice type where each member has its own name.

With a variant type, pattern matching over a binary tree becomes much easier:
```isl
variant BinaryTree<V>
	Leaf: V
	Internal: (leftNode: BinaryTree<V>?, rightNode: BinaryTree<V>?)

function leafOrInternal<T>(match tree: BinaryTree<T>)
	case Leaf
		return "leaf!"

	case Internal
		return "internal!"
```

Values of variant members can be assigned, matched and extracted using the `VariantMemberName(value)` syntax:
```isl
stream traverseBinaryTree<T>(match tree: BinaryTree<T>)
	case Leaf(let value)
		yield value

	// Tuple typed variant members don't require the extra parentheses
	// e.g. instead of Internal((left: ...., right: ....))
	//    we can write Internal(left: ...., right: ....)
	case Internal(let left: BinaryTree<T>?, let right: BinaryTree<T>?)
		if left is not nothing
			yield stream traverseBinaryTree(left)

		if right is not nothing
			yield stream traverseBinaryTree(right)
```

Variant types allow for including members with **duplicate types**:
```isl
variant Currency
	USDollar: decimal
	Euro: decimal
	Yen: decimal

let money: Currency = Euro(45.0)
```

Variant types with members of tuple types allow including a `where` clause, in which the tuple's member names are introduced. In practice this appears similarly to how objects are matched:

```isl
variant PersonOrCar
	Person: (name: string, height: decimal)
	Car: (brand: string, maxSpeed: decimal)

function getResponseString(match personOrCar: PersonOrCar)
	case Person where name == "James" => "Hi James"
	case Person where height >= 2.0 => "Tall person"
	case Car where maxSpeed >= 200.0 => "Fast car"
	otherwise => "Not interesting"
```

Same as above using the constructor-style syntax:
```isl
function getResponseString(match personOrCar: PersonOrCar)
	case Person("James", ...) => "Hi James"
	case Person(_, _ >= 2.0, ...) => "Tall person"
	case Car(_, _ >= 200, ...) => "Fast car"
	otherwise => "Not interesting"
```

Members may individually include their own set of type parameters (this is related to the concept of **generalized algebraic data types**):
```isl
variant PairOrTriple
	Pair<T>: (x: T, y: T)
	Triple<V>: (x: V, y: V, z: V)

function matchPairOrTriple(match pairOrTriple: PairOrTriple)
	case Pair<string>("James", _) => "Hi James"
	case Pair<string>("XYZ" ,"123") => "123"
	case Pair<integer>(1 ,_ > 100) => "Good"
	case Triple<integer>(_, _, 55) => "55"
	case Triple<boolean>(_, false, true) => "OK!"
	otherwise => "Not interesting"
```

Variant types can be **extended**:
```isl
variant Currency
	USDollar: decimal
	Euro: decimal
	Yen: decimal

variant ExtendedCurrency extends Currency
	CanadianDollar: decimal
	PoundSterling: decimal

variant ExtendedMoreCurrency extends ExtendedCurrency
	SwedishKrona: decimal
	SwissFranc: decimal
```

An extended variant type is a **super-type** of the variant it inherits from. This is the opposite relationship when compared to class inheritance, which creates a subtype.

For example:
```isl
function giveMeMoney(money: Currency)
	....

giveMeMoney(Currency.Euro(10.0)) // works
giveMeMoney(ExtendedCurrency.CanadianDollar(10.0)) // doesn't work
```

However:
```isl
function giveMeMoney(money: ExtendedCurrency)
	....

giveMeMoney(Currency.Euro(10.0)) // works
giveMeMoney(ExtendedCurrency.CanadianDollar(10.0)) // works
giveMeMoney(ExtendedMoreCurrency.SwissFranc(10.0)) // doesn't work
```

An extending variant type may **override** one or more members, as long as the overriding type is a super-type of the original:
```isl
variant WordKind
	ActionWord: TransitiveVerb
	ObjectWord: Noun

variant ExtendedWordKind extends WordKind
	ActionWord: Verb // Verb is a super-type of TransitiveVerb
```

Variants may contain **untyped members**, which can be useful for representing possibilities or states that don't carry any data with them:

```isl
variant Currency
	USDollar: decimal
	Euro: decimal
	Unknown
```

Variant types may **embed class declarations** for one or more of their members. Declaring `Internal` as an embedded class now allows to implement a specialized `traverse` method for the `Internal` member:
```isl
variant BinaryTree<V>
	Leaf: V

	Internal: class
		leftNode: BinaryTree<V>?
		rightNode: BinaryTree<V>?

		hasChildren => (leftNode, rightNode) is not (nothing, nothing)

		stream traverse()
			yield stream leftNode?.traverse()
			yield stream rightNode?.traverse()
```

Like classes, variants may have **companion type objects**, which also enable them to support type features:
```isl
variant BinaryTree<V>
	....

object BinaryTree<V> extends Comparable<BinaryTree<V>>, Equatable<BinaryTree<V>>
	stream traverse(match tree: BinaryTree<V>)
		case Leaf(let value)
			yield value

		case Internal
			yield stream tree.iterate()

	function compare(t1: BinaryTree<V>, t2: BinaryTree<V>): integer
		....

	operator ==(t1: BinaryTree<V>, t2: BinaryTree<V>): boolean
		....
```

Individual members of the variant may also receive their own **dedicated type objects**:
```isl
object BinaryTree<V> extends Comparable<BinaryTree<V>>, Equatable<BinaryTree<V>>
	....

	object Leaf extends Comparable<BinaryTree<V>.Leaf>, Equatable<BinaryTree<V>.Leaf>
		....

	object Internal extends Comparable<BinaryTree<V>.Internal>, Equatable<BinaryTree<V>.Internal>
		....
```

## Enumerations

An **enumeration** is a type expressing a choice between a set of identifiers associated with constant values. By default, enumeration members receive integer values following the sequence `1, 2, 3, ...`

```isl
enumeration StatusCode
	Waiting
	OK
	Failed

action alertStatus (match status: StatusCode)
	case Waiting => print("Still waiting..")
	case OK => print("Everything is OK!")
	case Failed => print("Damn, failed :(")
```

Enumerations are special forms of variant types where each member must receive a unique type (which can also be a literal type like `4`, `"hello"` or `true`).

Here is `StatusCode` equivalently expressed as its underlying variant type:
```isl
variant StatusCode // 1, 2, 3 are literal *types*
	Waiting: 1
	OK: 2
	Failed: 3

let status: StatusCode = StatusCode.OK
```

Enumeration members can have integer values other than the `1, 2, 3, ...` sequence. If a member value is explicitly specified, all following members without explicit values are automatically incremented relative to it:
```isl
enumeration HttpStatusCode
	OK = 200
	Created  // = 201
	Accepted // = 202
	MultipleChices = 300
	MovedPermanently // = 301
	Found 			 // = 302
	BadRequest = 400
	Unauthorized	 // = 401
	PaymentRequired  // = 402
```

Enumerations can have members of types other than `integer`, however, in this case all member values have to be explicitly specified:
```isl
enumeration Direction
	Up = "UP"
	Down = "DOWN"
	Left = "LEFT"
	Right = "RIGHT"
```

## The `nothing` type and the `?` operator

So far we've occasionally used the `nothing` keyword, but hadn't really got into the details of what it really is.

`nothing` may look superficially similar to `null` in other languages. However, in Island `nothing` is not primarily a value, but a type.

Take for example:
```isl
function computeSomething(integer num): integer or nothing // can also be written as 'integer?'
	when num >= 0
		return num * 2
	otherwise
		return nothing // `nothing` here acts somewhat like `null`

let x = computeSomething(-1) // what type and value does 'x' receive?
```

`return nothing` might seem like a value named `nothing` is being returned from the function (similarly to, say `return null` would in other languages). However, in practice, what is really happening is that `x` receives the type `nothing` which by default has **a single empty value** which is also called `nothing` (this behavior is similar to a concept known as the **unit type**).

Actions that don't return any value can be optionally annotated as returning `nothing`:
```isl
action printHelloWorld(): nothing // `nothing` here acts like `void` in the C family of languages
	print("Hello World!")
```

Trying the read the result of a method returning only `nothing` (either annotated as such or not) will fail, since the `nothing` type doesn't contain any useful information by itself:
```isl
let x = printHelloWorld() // Error: printHelloWorld() returns only `nothing`
```

The `nothing` type is designed such that there is very little you can do with it. However, it is at times a very useful tool when defining optional parameters or capturing "soft" failures when returning from methods.

The question mark symbol (`?`) would modify a type to become a choice type including `nothing` as one of its options. It would work on any type, including a type that already is a choice type, for example:

```isl
type Number = integer or decimal
type PossiblyNumber = Number? // PossiblyNumber = integer or decimal or nothing
```

The `?` symbol can also be used in several other ways:

The **null-conditional operator** applies member access `?.`, index access `?[]` or method call `?()` only if the preceding expression fragment evaluates to a value that is not of type `nothing`, otherwise, the entire enclosing expression evaluates to `nothing`:

```isl
class Address
	city: string
	street: string
	houseNumber: integer

class Person
	name: string
	address: Address or nothing
	petNames: List<string> or nothing

let person = Person with name = "Jimmy Jones", address = nothing, petNames = nothing

let houseNumber = person.address?.houseNumber // houseNumber = nothing
let firstPetName = person.petNames?[1] // firstPetName = nothing
```


_Some notes on possible confusion with terminology used by other languages: In Island the unit type is called `nothing` and the bottom type is called `never` (introduced in a following chapter). In Scala the unit type is called `Unit` and the bottom type `Nothing`. However Haskell uses the term `Nothing` in its option type to represent the option of having "No value", which is closer to the semantics intended here._

## The `any` type

The `any` type (roughly representing the **top type**). It is equivalent to a choice type including of all the types in the language, except `nothing` and `never` (`any?` would include `nothing` as well) .

Note this is not the same as a dynamic type, because it requires an explicit type assertion or a cast in order to be used for any meaningful purpose:

```isl
function whatIsThis(match x: any)
	case integer => "integer!"
	case decimal => "decimal!"
	case string => "string!"
	case boolean => "boolean!"
	case List<boolean> => "list of booleans!"
	otherwise => "I don't know?"
```

Assigning from a value having the `any` type could also be done using an explicit cast:
```isl
let x: any = 5
let y: integer = x as integer
```

However assigning a value of the wrong type would produce a compile or runtime error:
```isl
let x: any = "hello"
let y: integer = x as integer // Error
```

## The `never` type

The `never` type represents the result of a computation that either never terminates, or always fails:

For example, if a `for` loop, running inside a `function` context, does not alter any of its variables and does not have any stopping condition, it is guaranteed to never terminate, and consequently the function would never return!

```isl
function neverEndingFunction(num: integer)
	for i = 1, out result = 1
		continue // never terminates!

	return result

let x = neverEndingFunction(0) // what type is x?
```

In this case you may think the compiler should just raise an error (it will). However, `x` will also get the `never` type, which would be useful to allow more errors to be reported down the road.

Sometimes there are only particular cases where the function never returns:

```isl
function maybeNeverEndingFunction(num: integer)
	for i = 1, out result = 1 while num > 0
		continue

	return result

let mysteryValue: integer = mysteryFunction(....)
let x = maybeNeverEndingFunction(mysteryValue) // what type is x?
```

If `num <= 0` the function would return immediately with the value `1`. However, when `num > 0` it will never terminate.

So `x` receives the type `integer or never`, which roughly means "if x has a value, it is of type `integer`, but it may also never get to the point where receives any value".

The `never` type is also known as the **bottom type**, meaning it is a type that has no values, and behaves somewhat like the empty set Ø.

## Join types

A **join type** (also called an **intersection type**) allows combining multiple features in a convenient form:

If we wanted to write a function that accepts a parameter of a type implementing the two features `Named` and `Numbered` we could do something like:
```isl
feature Named
	name: string

feature Numbered
	id: integer

feature NamedAndNumbered extends Named, Numbered

function giveMeNamedAndNumbered(value: NamedAndNumbered)
	....
```
Using a join type, this can be shortened to:
```isl
feature Named
	name: string

feature Numbered
	id: integer

function giveMeNamedAndNumbered(value: Named and Numbered)
	....
```

## Member and parameter type references

Object or tuple type references may include references to members, method parameter or return types:

```isl
class Person
	name: string
	data: (integer, boolean, id: string)

	action processMe(someData: integer, moreData: string): Set<string>
		....

let n: Person.name // n receives the type string
let d: Person.data[2] // d receives the type boolean
let id: Person.data.id // id receives the type string

let p: Person.processMe.params // p receives the tuple type (someData: integer, moreData: string)
let md: Person.processMe.moreData // md receieves the type string (might be a choice type if overloaded)
let r: Person.processMe.return // r receives the type Set<string>
```

Same for methods outside of a class:
```isl
function myFunc(p1: (integer, boolean)): List<string>
	....

let t: myFunc.p1 // t gets the type (integer, boolean)
let r: myFunc.p1.return // r gets the type List<string>
```

Referring to the types of companion object members is possible through the `(object Type)` syntax:
```isl
object Person
	bestPerson: string = "Cleopatra"

let best: (object Person).bestPerson // best receives the type string
```

## Higher-kinded features

# Exception handling

## Failure types

So far we've used `nothing` to represent failure cases, i.e. cases where the function doesn't succeed and instead returns an empty return value.

Sometimes we wish to be more specific and provide a more detailed report on what exactly went wrong. This is made possible by the **failure type**, which is a type representing a failed computation, and may also include further information.

Consider this case:
```isl
function divide(x: integer, y: integer)
	return x / y

let r = divide(10, 0) // What should be the type of `r`?
```

One approach would be to return `nothing` when `y` is 0:
```isl
function divide(x: integer, y: integer): integer?
	when y == 0 => nothing
	otherwise => x / y

let r1 = divide(10, someInt) // `r1` gets type integer or nothing
let r2 = divide(10, 0) // `r2` gets type nothing

let r3 = r1 + 10 // Error: r1 may be of type nothing!
let r4 = r2 + 10 // Error: r2 is of type nothing!
```

However, that would mean that in every computation done with `divide` we would have to use a type assertion to check if the result type is not `nothing` and then proceed:

```isl
let r3
if r1 is not nothing
	r3 = r1 + 10
```

Alternatively, the **Failure type** is a special type designated to represent failures.

Island has two approaches to using the failure type:

1. Returned directly from a method, as a part of a choice type, and then optionally assert on through the returned value. This is the only approach permittable for a function.
2. Use the `fail` statement to raise an error, together with a `check`..`detect` block to capture the error in a caller scope. This is only possible in action scopes.

## Returning the failure type from a method

The failure type possesses a special "vanishing" quality when included inside of a choice type. If the choice type contains only a single type that is not of type `failure` then no assertion is needed for the variable to be used as if it could only have that type.

```isl
function divide(x: integer, y: integer)
	when y == 0 => Failure("Divide by zero!")
	otherwise => x / y

let r1 = divide(10, someInt) // `r1` gets type integer or Failure<string>
let r2 = divide(10, 0) // `r2` gets type Failure<string>

let r3 = r1 + 10 // Works! no type assertion needed!
let r4 = r2 + 10 // Error: r2 is of type Failure<string>
```

Note that if the result of the operation is immediately unpacked, the failure can still be asserted for any one of the unpacked variables:

```isl
function getKeyOrFail(key: integer, dict: { string: (age: integer, bestFriend: string) })
	when key in dict => dict[key]
	otherwise => Failure("Key '{key}' not found!")

let someDictionary = { "Linda": (25, "Mary"),  "Alan": (34, "Anton") }

let (age, bestFriend) = getKeyOrFail("James", someDictionary)

if age is Failure
	print("Couldn't find 'James' in the dictionary!")
```

## Using `check`..`detect` (action scopes only)

The second approach, available only in action scopes (due to its use of side-effects), uses a `check`..`detect` block and behaves very similarly to `try`, `catch` in mainstream imperative languages:

```isl
action readLineFromFile(f: File)
	if not f.exists
		fail IOFailure("File not found")

	return f.ReadLine()

action example(f: File)
	check
		let line = readLineFromFile(f)
		print(line)
	detect failure: IOFailure
		print(failure.message)
```

# Patterns and parsers
## Pattern methods

We've previously introduced a syntax for list, tuple and object patterns, which can be used for pattern matching in conditional statements and expressions, such as:

```isl
match myList
	case []
		....
	case [let head < 10, ...]
		....
	case [25, ..., let last]
		....
	case [_ >= 10, let ...tail]
		....
	case [let first < 0, let second != first, let ...rest]
		....
	case [..., let v > 5, ...]
		....
```

**Pattern methods** generalize over this feature, and allow to define arbitrary pattern recognizers via special-purpose subroutine-like helpers.

Pattern methods can also be used as a full replacement for string regular expressions.

For instance, we'll look at a regular expression that captures a phone number pattern. Conventionally we'll define something like:
```isl
let PhoneNumberRegExp = /^[\+]?[ ]?([0-9][0-9]?[0-9]?)[ ]?\(([0-9][0-9][0-9])\)[ ]?([0-9][0-9][0-9])\-([0-9][0-9][0-9][0-9])$/

// Example matching string: "+1 (534) 953-6345"

match str
	case PhoneNumberRegExp of ("1", "800", _, let lineNumber)
		....
```

With a pattern method, we could instead write:
```isl
match str
	case PhoneNumberPattern of ("1", "800", _, let lineNumber)
		....
```

Where `PhoneNumberPattern` would be a pattern method defined as:
```isl
pattern PhoneNumberPattern() of (countryCode, areaCode, prefix, lineNumber) in string
	accept optional '+'
	countryCode = accept Repeated(Digit, 1, 3)
	accept optional ' '
	accept '('
	areaCode = accept Repeated(Digit, 3)
	accept ')'
	accept optional ' '
	prefix = accept Repeated(Digit, 3)
	accept '-'
	lineNumber = accept Repeated(Digit, 4)
	accept end
```

A pattern method is written similarly to a standard method only it employs the `accept` keyword which implicitly "advances" the recognizer whenever a pattern is matched:

```isl
.... = accept .... // Require the next member of the stream to match the given pattern and return it
.... = accept optional ....  // Try to match the given pattern and return it, or skip if failed
accept end // Accept only if the stream ended
```

In the above example, `Repeated` and `Digit` are references to secondary pattern methods.

`Digit` can be defined as:
```isl
pattern Digit() of (value) in string
	value = accept if _ in { '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' }
```

`accept if ....` will accept only if the given condition is satisfied. The `_` has semantics similar to how its used in pattern matching, i.e. analogous to what it would mean in a pattern like `[_ >= 10, ...]` where it contextually matches the corresponding element of a list.

`Repeated` is a more complex, higher-order pattern method parameterized over any underlying pattern, as well as for any stream type (which includes strings). Its implementation is included in a future section about abstract patterns.

## Transactional execution
The `try`... `else try`...`else` block enables a limited form of **transactional execution** where multiple branches are attempted in turn until one of them succeeds (or otherwise the input is rejected). Whenever a failure occurs within a branch, its assignments are rolled back.

Here's an illustrative example which will recognize and parse a date with any one of `'/'`, `'-'` or `'.'` as separator characters:
```isl
pattern Date() of (day, month, year) in string
	// Will recognize a date like "21/5/1999" or "13-7-2020"
	day = accept IntegerNumber(1, 31)

	try
		accept '/'
		month = accept IntegerNumber(1, 12)
		accept '/'
	else try
		accept '-'
		month = accept IntegerNumber(1, 12)
		accept '-'
	else try
		accept '.'
		month = accept IntegerNumber(1, 12)
		accept '.'

	year = accept IntegerNumber

	accept end

match str
	case Date of (1, 12, let year >= 2005)
		....
```

Pattern methods can recognize and parse patterns that go well beyond the constraints of regular languages.

We could rewrite the previous example such that the pattern method would be parameterized by an arbitrary set of separator characters:

```isl
pattern Date(seperatorCharacterSet: Set<string>) of (day, month, year) in string
	day = accept IntegerNumber(1, 31)

	let seperator = accept if _ in seperatorCharacterSet
	month = accept IntegerNumber(1, 12)
	accept separator // The accepted character must be the same as the one previously captured

	year = accept IntegerNumber

	accept end

match str
	case Date({'/', '-', '.'}) of (1, 12, let year >= 2005)
		....
```

## Patterns in non-character streams

Pattern methods can be used for arbitrary streams. Here it is used to recognize patterns in sequences of integers:
```isl
// Recognizes a sequence of exactly three primes p1, p2, p3
pattern ThreePrimes() in Stream<integer>
	predicate isPrime(num) => ....

	for _ in 1..3
		accept if isPrime(_)

	accept end

// Recognizes 2, 4, 6, 8, 10, ....
pattern EvenNaturalNumberSeries() in Stream<integer>
	let evenNumbers = (n in 1.. where n mod 2 == 0) => n

	for i in evenNumbers
		try
			accept if _ == i
		else try
			accept end

// Recognizes a stream of twin prime tuples like:
// (3, 5), (5, 7), (11, 13), (5, 7), (29, 31), (3, 5), ....
// (The sequence doesn't have to be ordered and pairs don't have to be unique)
pattern TwinPrimesSequence() in Stream<(integer, integer)>
	predicate isPrime(num) => ....

	pattern TwinPrimes in Stream<(integer, integer)>
		try
			let (p1, p2) = accept

			if p2 != p1 + 2 or not isPrime(p1) or not isPrime(p2)
				reject

	repeat
		try
			accept TwinPrimes
		else try
			accept end
```

## Lookahead

Sometimes it is useful to access one or more upcoming members of the stream without consuming it.

The `expect` keyword acts similarly to `accept`, only without advancing the current position in the stream.

For example in order to define a pattern that parses the content of an XML `<title>` element:
```isl
pattern TitleXMLElement() in string
	accept "<title>"

	repeat
		try
			expect "</title>"
			break // break out of the loop without advancing the read position
		else try
			accept Letter

	accept "</title>" // since the stream position has not advanced, this should always succeed
```

More generally, this approach can be used to define a pattern which would accept anything until a stop pattern is encountered:
```isl
pattern AnythingUntil<T>(StopPattern: pattern in Stream<T>) of (results: List<T>) in Stream<T>
	repeat
		try
			expect StopPattern
			break // break out of the loop without advancing the read position
		else try
			results += accept
```

## Abstract and higher-order patterns

The `match` syntax can also apply to abstract pattern types.

An abstract pattern may be expressed using a polymorphic type signature like:

```isl
type MyAbstractPattern = pattern() of (integer, boolean) in string
```

And then can be used to parameterize a function over any pattern that matches a given type signature. For example:
```isl
function recognizeThis(str: string, p: MyAbstractPattern, expectedValues: (integer, boolean))
	match str
		case p of expectedValues:
			return true
		else
			return false

pattern MyPattern() of (value, ok) in string
	value = accept IntegerNumber
	accept ' '

	try
		accept 'Yes'
		ok = true
	else try
		accept 'No'
		ok = false

	accept end

recognizeThis("42 Yes", MyPattern, (42, true)) // returns true
recognizeThis("10 No", MyPattern, (20, false)) // returns false
```

Here's an implementation of the `Repeated` pattern mentioned in a previous section. It defines a higher-order pattern accepting an abstract pattern of polymorphic type.
```isl
type AnyPattern<T> = pattern() in Stream<T>

pattern Repeated<T> (p: AnyPattern<T>, minTimes: integer, maxTimes: integer) of (results: List<T> = []) in Stream<T>
	if minTimes >= 1
		for _ in 1..minTimes
			results += accept p
			// `results` acts similarly to a named return variable
			// It can be incrementally updated,
			// However, it can only be read when assigned back to itself

	for _ in minTimes..maxTimes
		try
			results += accept p
		else
			break

pattern Repeated<T> (p: AnyPattern<T>, times: integer) of (results: List<T> = []) in Stream<T>
	results = accept Repeated(p, times, times)
```

## Unpacking through a pattern method

Since pattern methods may reject some inputs, it is not possible to directly unpack via a pattern, say, with this kind of hypothetical syntax:
```isl
let str = "5/11/1972"

Date of let (day, month, year) = str // What would be assigned if the string is rejected?
```

Instead, the `matches` operator, introduced in a previous chapter, allows to conditionally "unpack" through the pattern, as well as safely handle the case where the input is rejected:
```isl
let str = "5/11/1972"

if str matches Date of let (day, month, year)
	....
else
	....
```

# Logic programming

## Relations, facts and rules

Island provides a statically typed logic programming system integrating closely with the rest of the language.

The `relation` declaration defines a relation, which, in a sense, expands over the concept of a function and provides a way to express and query multi-directional dependencies between its parameters (also referred to as _terms_).

With respect to its output, a relation is, in practice, a lot like a stream method yielding a sequence of tuples where each tuple in the sequence represent a satisfying assignment for its terms.

A `relation fact` statement defines a fact, which is like an axiom containing a combination of term values that is always true.

A `relation rule` defines a conjunction of one or more clauses (also called goals) where a set of input arguments (which may be either assigned or unassigned) are flowed through them. If a goal cannot be satisfied with the given arguments the inference engine backtracks to the previous goal and proceeds with its next satisfying assignment. This continues either until the final goal is satisfied or all the possible alternatives are exhausted.

Here's the classic parent-siblings example expressed in Island's logic programming syntax:

```isl
class Family
	relation Parent
		fact ("Alice", "James")
		fact ("Alice", "Angela")
		fact ("Tom", "John")

	relation Siblings
		rule (sibiling1: string, sibling2: string)
			Parent(let someParent, sibling1)
			Parent(someParent, sibling2)
			NotEqual(sibling1, sibling2)

let family = Family()

// Remember that since Parent returns a stream
// Getting its first result would require stepping once through the stream
// The 'exists' expansion property returns true if a stream yields at least one value
// The 'first' expansion property returns the first value yielded
family.Parent("Alice", _).exists // returns true
family.Parent("Alice", "Angela").exists // returns true
family.Parent("Alice", "Angela").first // returns ("Alice", "Angela")
family.Parent("Alice", "John").exists // returns false
family.Parent(_, "John").exists // returns true
family.Parent(_, "John").first?.parent // returns "Tom"

for (sibling1, sibling2) in family.Siblings(_, _)
	print("({sibling1}, {sibling2})")

// prints "(James, Angela)", "(Angela, James)"
```
_(Note that the order of `sibling1` and `sibling2` is significant for the inference engine - since it has no way to know the `Sibling` relation is symmetric - the results included what appears like duplicates, in the next example we'll apply `.distinctUnorderedPairs()` on the result sequence to filter out the duplicates)_

A relation's fact database may be non-destructively altered using the `with` operator, applied over the containing object:
```isl
let alteredFamlily = family with
	Parent("Alice", "Lea")
	Parent("Alice", "Chris")
	no Parent("Alice", "James")

for (sibling1, sibling2) in alteredFamlily.Siblings(_, _).distinctUnorderedPairs()
	print("({sibling1}, {sibling2})")

// prints "(Angela, Lea)", "(Angela, Chris)", "(Lea, Chris)"
```

Here is factorial defined as a relation:
```isl
relation Factorial
	fact (0, 1)

	rule (number: integer, result: integer)
		GreaterThan(number, 0)
		Subtraction(number, 1, let previousNumber)
		Factorial(previousNumber, let previousFactorial)
		Product(number, previousFactorial, result)

print(Factorial(5, _).first) // Prints "(5, 120)"
print(Factorial(5, _).first.result) // Prints "120"

// Since Factorial is a relation we could potentially query for any one of its parameters
// Here we'll query which number has the factorial of 5040
print(Factorial(_, 5040).first) // Prints "(7, 5040)"
print(Factorial(_, 5040).first?.number) // Prints "7"
```

## Relation predicates, functions and streams

In order to express numeric relations like `GreaterThan`, `Subtraction` and `Product` we will need some means to link relations with plain functions:

* The `predicate` declaration defines a simple predicate function returning `true` or `false`.
* The `function` declaration defines a simple function returning a tuple representing a single term assignment
* The `stream` declaration defines a stream method yielding a sequence of term assignments.
* Every relation method parameter must be annotated as either `in` or `out`, where `in` parameter must be returned unmodified in the resulting tuple and `out` parameters must receive a value.

For example, here's how the `GreaterThan` relation is defined. There are several overloads defined for different combinations of input and output terms (modified by `in` and `out` respectively):

The `(in, in)` overload, in which both terms are known values is implemented using a predicate function, simply tests whether the first term is greater than the second one:
```isl
relation GreaterThan
	predicate (in num1: integer, in num2: integer) => num1 > num2
```

The `(in, out)` overload, in which the first term is a value and the second unknown, defines a stream method yielding a sequence of tuples where the first element is always (and must always be!) `num1` and the second enumerates all the values smaller than `num1`.
```isl
relation GreaterThan
	stream (in num1: integer, out num2: integer)
		for i = num1 - 1 advance i -= 1
			yield (num1, i)

		// yields (num1, num1 - 1), (num1, num1 - 2), (num1, num1 - 3), ...
```

The `(out, in)` overload defines a stream method yielding a sequence of tuples where the first element enumerates all the values greater than `num2` and the second is always `num2`.
```isl
relation GreaterThan
	stream (out num1: integer, in num2: integer)
		for i = num2 + 1 advance i += 1
			yield (i, num2)

	// yields (num2 + 1, num2), (num2 + 2, num2), (num2 + 3, num2), ...
```

Since `in` parameters are always returned as-is in the resulting tuple, we can avoid stating them in the `yield` statement by using `continue`- like syntax, which allows omitting arguments that were not assigned by the function. The following is equivalent:
```isl
relation GreaterThan
	stream (in num1: integer, out num2: integer)
		for i = num2 + 1 advance i += 1
			yield num2 = i // implicitly equivalent to yielding the tuple (num1, i)
```

_(An `(out, out)` overload might also be defined, in theory, though it would be significantly more challenging to implement as it would need to somehow "fairly" cover all possible combinations of two integers where the first one is greater than the second)_

Here's how the `Subtraction` relation is defined:

```isl
relation Subtraction
	predicate (in num1: integer, in num2: integer, in difference: integer) =>
		num1 - num2 == difference

	function (in num1: integer, in num2: integer, out difference: integer) =>
		(num1, num2, num1 - num2)

	function (in num1: integer, out num2: integer, in difference: integer) =>
		(num1, num1 - difference, difference)

	function (out num1: integer, in num2: integer, in difference: integer) =>
		(num1 + num2, num2, difference)

	// For illustration, here's a stream method defined for the more complex
	// case where both num1 and num2 are unknowns:
	stream (out num1: integer, out num2: integer, in difference: integer)
		yield (0, 0 - difference, difference) // yield the case for num1 == 0

		// Alternate between positive and negative values for num1
		for i = 1 advance i += 1
			yield num1 = i, num2 = i - difference
			yield num1 = -i, num2 = -i - difference

		// For the case where difference = 2 this would yield:
		// (0, -2, 2), (1, -1, 2), (-1, -3, 2), (2, 0, 2), (-2, -4, 2), ....
```

The `when` keyword allows branch-like functionality for relation blocks:

Here's the infamous "Fizz-Buzz" problem, this time implemented using a relation:
```isl
relation Divides
	predicate (in x, in y) => x mod y == 0

relation FizzBuzz
	rule (index: integer, output: string)
		InRange(index, 1, infinity)

		when Divides(index, 15)
			Equals(output, "FizzBuzz")
		when Divides(index, 3)
			Equals(output, "Fizz")
		when Divides(index, 5)
			Equals(output, "Buzz")
		otherwise
			Equals(output, "{index}")

FizzBuzz(30, "Buzz").exists // returns false
FizzBuzz(30, _).exists // returns true
FizzBuzz(30, _).first?.output // returns "FizzBuzz"
FizzBuzz(30, "FizzBuzz").exists // returns true

for (_, str) in FizzBuzz(_, _)
	print(str)

	// prints "1", "2", "Fizz", "4", "Buzz", "Fizz" ....
```

`when` blocks also handle cases where the conditional cannot be resolved:

For example, in the case where `FizzBuzz(_, "Fizz")` is queried, since `index` isn't bound to anything on the `when` conditional, the inference engine unconditionally evaluates the branch, as well as any other unresolvable conditional branches, which in this example includes all of them (the `otherwise` branch is considered unresolvable as well):

```isl
for (index, _) in FizzBuzzer.FizzBuzz(_, "Fizz")
	print(index)

	// prints 3, 6, 9, 12, 18, 21, ....
```

Here's the absolute value implemented as a relation using a `when` conditional:
```isl
relation Abs
	rule (number: integer, abs: integer)
		when GreaterThanOrEquals(number, 0)
			Equals(number, abs)
		otherwise
			Negation(number, let negation)
			Equals(abs, negation)

Abs(-65, 100).exists // returns false
Abs(-65, 65).exists // returns true
Abs(-65, _).first?.abs // returns 65
Abs(_, 65).first?.number // returns -65

// This will query for any two numbers where the second is the absolute value of the first:
for (number, abs) in Abs(_, _)
	print("({number}, {abs})")

	// prints "(0, 0)", "(-1, 1)", "(1, -1)", "(-2, 2)", ....

	// (As a heuristic, the inference engine alternates between the unresolvable conditional branches to
	//  avoid getting "trapped" in case one of them produces an infinite amount of results)
```

Sometimes we would like to iterate over **all** the possible results of a relation. A common case would be when asserting over a property of a list:
```isl
relation MemberOf
	predicate (in member, in list: List<integer>) => list.includes(member)
	function (out member, in list: List<integer>) = for x in list => (x, list)

relation AllMembersGreaterThan
	rule (in list: List<integer>, smallerValue: integer)
		foreach MemberOf(let member, list)
			GreaterThan(member, smallerValue)

AllMembersGreaterThan([3, 2, 4, 5], 3).exists // returns false
AllMembersGreaterThan([3, 2, 4, 5], -5).exists // returns true
```

It would be interesting to consider the query `AllMembersGreaterThan([3, 2, 4, 5], _)`, which asks for one or more values that are smaller than all the elements of the list.

Let's consider the execution of:
```isl
AllMembersGreaterThan([3, 2, 4, 5], _)
```

If we were to unroll the `foreach` loop to multiple steps it would look somewhat like:
```isl
GreaterThan(3, smallerValue) // Produces 2, 1, 0, -1, -2, -3, .... for smallerValue
GreaterThan(2, smallerValue)
GreaterThan(4, smallerValue)
GreaterThan(5, smallerValue)
```

Once `smallerValue` receives a value in `GreaterThan(3, _)` the next evaluations of `GreaterThan` test for that value. If it doesn't satisfy them, the inference engine backtracks until a value for `smallerValue` is found that satisfies all the members (i.e. in this case `1`, which is smaller than all the members).

As you may notice this is a highly inefficient way to calculate this! Consider the case where `list = [3, 2, 4, -1000000]`, it would require more than one million backtracking attempts to find the first satisfying result `-1000001`!

A more efficient way would be to to define an overload based on a `relation function` that quickly finds the minimum of the list and yields all the values smaller than it:
```isl
relation AllMembersGreaterThan
	function (in list: List<integer>, out smallerValue: integer) =
		for i in (list.minimum() - 1)..(-infinity) => (list, i)
```

Note that to ensure that the `(in, out)` case is never processed by the slower, backtracking-based overload, its `smallerValue` parameter can be marked as `in`:
```isl
relation AllMembersGreaterThan
	rule (in list: List<integer>, in smallerValue: integer)
	....
```

In the next section we'll show a purely rule-based way to efficiently implement the `AllMembersGreaterThan` relation, which makes use of the `reduce` higher-order relation.

## Higher-order relations

Just like functions can accept other functions as arguments, we can define relations that accept other relations as arguments:

Here's an implementation of the `map` function, generalized to a relation:
```isl
relation Mapped<E, R>
	type MappingRelation = relation(value: E, resultValue: R)

	fact ([], [], _)

	rule ([head, ...tail]: List<E>, [resultHead,...resultTail]: List<R>, in mappingRelation: MappingRelation)
		mappingRelation(head, resultHead)
		Mapped(tail, resultTail)
```

Here's an example that represents a mapping between one list to a second list containing its members' preceding values:
```isl
relation Successor
	predicate (in x: integer, in y: integer) => x == y + 1
	function (in x: integer, out y: integer) => (x, y - 1)
	function (out x: integer, in y: integer) => (y + 1, y)

let l1 = [2, 3, 4, 5]
let l2 = [1, 2, 3, 4]
Mapped(l1, l2, Successor).exists // returns true
Mapped(l1, _, Successor).first // returns ([2, 3, 4, 5], [1, 2, 3, 4], Successor)
Mapped(l1, _, Successor).first?[2] // returns [1, 2, 3, 4]
Mapped(_, l2, Successor).first?[1] // returns [2, 3, 4, 5]
Mapped(_, l1, Successor).first?[1] // returns [3, 4, 5, 6]
```

Here's `reduce` expressed as a higher order relation:
```isl
relation Reduced<E, R>
	type ReducingRelation = relation(in element: E, in currentResult: R, newResult: R)

	fact ([], _, _, nothing)

	rule (in [head, ...tail]: List<E>, in reducer: ReducingRelation, in initialResult: R, result: R)
		reducer(head, initialResult, let newResult)

		when Equals(tail, [])
			Equals(result, newResult)
		otherwise
			Reduced(tail, reducer, newResult, result)
```

Using the `reduced` relation we now can provide a more efficient rule-based implementation for `AllMembersGreaterThan`:
```isl
relation MinimumOf2
	rule (val1: integer, val2: integer, minimum: integer)
		when SmallerOrEqual(val1, val2)
			Equals(minimum, val1)
		otherwise
			Equals(minimum, val2)

relation SmallestValue
	fact ([], nothing)

	rule (in values: List<integer>, smallestValue: integer)
		Reduced(values, MinimumOf2, infinity, smallestValue)

relation AllMembersGreaterThan
	rule (in values: List<integer>, smallerValue: integer)
		SmallestValue(list, let smallestValue)
		SmallerThan(smallestValue, smallerValue)
```

## Immutability and determinism in the logic programming subsystem

The logic programming subsystem is fully compliant with the immutability constraint. A rule's arguments can be either assigned (meaning they are bound to a concrete value) or unassigned. If they are assigned they cannot accept a new value (there's simply no mechanism to do that) and if they are unassigned they can only be assigned once by a subgoal.

Determinism (which is related to the property of referential transparency), means that an invocation of a relation with the same arguments would always yield the same results, and in the same order. Determinism is preserved since:
* There is no `action relation`. Relations do not have any side-effects.
* Objects containing relations cannot be modified in-place. Facts cannot be added or removed from a relation unless the object is copied first (as is done with the `with` operator).
* The inference engine is designed to always perform the search in the same order (even if the search is parallelized), so given the same clauses and fact database, it would always produce identical results (note it is meant that it would produce the same results **for a given runtime session**, changes in the ordering of declarations or files, or different versions of the compiler, might cause variations in the ordering).

# Reactive programming

## Reactive values

```isl
for currentTemperature in Weather.currentTemperature
	print("Current temperature is {currentTemperature}")

let temperatureIsOver20: reactive boolean = temperature > 20

for match currentlyOver20 in temperatureIsOver20
	case true
		print("Current temperature is over 20 degrees!")
	otherwise
		print("Current temperature is under 20 degrees!")

reactive lightSwitchState()
	for currentState: boolean? = nothing
		let newState = getLightSwitchState()

		if newState != currentState
			emit newState
			currentState = newState

		wait 100

reactive selection oneOfSeveralEvents
	Temperature = Weather.currentTemperature
	LightSwitch = lightSwitchState
	CustomIntEvent: integer

for match event in oneOfSeveralEvents
	case Temperature(let t)
		print("Temperature is now {t}")
		oneOfSeveralEvents << someAction(t) as CustomIntEvent // Implicitly spawns someAction
		// Execution immediately proceeds here

	case LightSwitch(let s)
		print("Light switch state is now {t}")

	case CustomIntEvent(let i)
		print("Custom int event of {i}")
```

```isl
class MyState
	downloadingFile: boolean = false

	downloadButtonPressed: reactive boolean = downloadButton.Pressed
	downloadResult: reactive (url: string, fileContent: string)
	outsideTemperature: reactive decimal = Weather.outsideTemperature

for state = MyState(), change in observe state
	match change, state.downloadingFile
		case MyState.downloadButtonPressed of (true), false
			print("Starting download..")
			let result = spawn downloadFile("https://example.com/someFile")
			continue state with (downloadingFile = true, downloadResult << result)

		case MyState.downloadButtonPressed of (true), true
			print("Already downloading!")

		case MyState.downloadResult of (let url, let fileContent), _
			print("Finished downloading {url}")
			spawn saveFile("myFile", fileContent)
			continue state with downloadingFile = false

		case MyState.outsideTemperature of (let temperature), _
			print("Current temperature is {temperature}")
```

# Symbolic data structures
## Symbolic structures

```isl
symbolic atom Term(a: integer): integer
symbolic function Plus(a: Term, b: Term): Term
symbolic function Minus(a: Term, b: Term): Term
symbolic function Expression(a: Term, b: Term): Term
symbolic function Sqrt(a: Term): Term

let x = Sqrt(Minus(Plus(Term(5), Term(10)), Term(4)))

unique type Expression = Plus: (a: Expression, b: Expression) or
					  Minus: (a: Expression, b: Expression) or
					  Literal: integer
```

Symbolic operators:
```isl
symbolic atom Term: integer
symbolic operator +(a: Term, b: Term): Term
symbolic operator -(a: Term, b: Term): Term
symbolic function Sqrt(a: Term): Term

let x = Sqrt((Term(5) + Term(10)) - Term(4))
```

# Misc. topics

## Lists and streams as array index specifiers

A list can be sliced using secondary list to specify an ordered subset of indices to be read from a list:
```isl
let nums = [10, 20, 30, 40, 50, 60, 70, 80, 90]
let indexes = [5, 3, 7]

let result = nums[indexes] // result = [50, 30, 70]
```

More generally, the same effect can be achieved using any stream of integers:
```isl
let nums = [10, 20, 30, 40, 50, 60, 70, 80, 90]
let indexStream = (for i in 9..1 where i % 3 == 0) => i

let result = nums[indexStream] // result = [90, 60, 30]
```

And for modifying an existing list:
```isl
let nums = [10, 20, 30, 40, 50, 60, 70, 80, 90]
let indexStream = (for i in 9..1 where i % 3 == 0) => i

let modifiedNums = nums with [indexStream] = [900, 600, 300]
// modifiedNums = [10, 20, 300, 40, 50, 600, 70, 80, 900]

let indicesToRemove = [4, 5, 7]
let modifiedNums2 = modifiedNums with no [indicesToRemove]
// modifiedNums2 = [10, 20, 300, 600, 80, 900]
```

## Recursion sugar and the `param` modifier

So far, we've tried to design convenient loops and comprehensions that abstract over recursive iteration patterns. We can also take some of those ideas back on the other direction - to make plain recursions simpler and more convenient to use.

The `recurse` keyword acts a lot like `continue` by allowing to only state the alterations needed for a recursive call, relative to the method's received argument set. In this example the return value is a named tuple, who's members double as parameters by being declared with the `param` keyword:

```isl
function repeatAandB(match count: integer): (param r1 = "", param r2 = "")
	case 0 => return
	otherwise => recurse count -= 1, r1 += "a", r2 += "b"

let (r1, r2) = repeatAandB(4) // r1 = "aaaa", r2 = "bbbb"
```
_(Technical note: for convenience `return` can be used both as a statement and expression in a `case` and `when` clause body)_

Note that by modifying the returned tuple members with the `param` keyword, they act like any other parameter and can be passed arguments when the method is called:
```isl
let (r1, r2) = repeatAandB(4, r1 = "Hello ", r2 = "World ") // r1 = "Hello aaaa", r2 = "World bbbb"
```

With these features, combined with named return values, we can further simplify the recursive binary search code from a previous chapter:

```isl
function binarySearch(values: List<integer>, target: integer)
	function iterate(low = 1, high = values.length): (mid = low + high / 2)?
		when low > high
			return nothing
		otherwise
			match values[mid]
				case target => return
				case _ < target => recurse low = mid + 1
				otherwise => recurse high = mid - 1

	return iterate()
```

## Deep comparison

Comparisons are always done by value and traverse deep structural hierarchies:

```isl
let t1 = (1, "Hi", true, [5, 4, 3, 2])
let t2 = (1, "Hi", true, [5, 4, 3, 2])
let t3 = (1, "Hi", true, [5, 4, 3, 1])

print(t1 == t2) // prints true
print(t2 == t3) // prints false
```

# TODO

## Namespaces
## Modules
## Attributes
## Infix functions
## Reflection
## Memoization
## Compile-time execution

# Closing chapter

## Influences

This work would not have been possible without ideas adapted from other languages: in particular C#, Python, JavaScript, TypeScript, Haskell, Swift, F#, Quorum, Scala, Prolog, Java, Oz and Pascal.

## Who wrote this?

Hi, I'm a software developer who loves designing programming languages.

## Feedback for this document

The repository is located at [github.com/island-lang/island-lang.github.io](https://github.com/island-lang/island-lang.github.io)

## Copyrights

Copyright © Rotem Dan<br />
2017 - 2021
