esgoggles
=========

Browser ide for reading and exploring javascript code.

Demo:

## Purpose

* Reading badly-formatted code is a hassle
* People don't always agree on preferred formatting, why not make it an individual preference?
	* Represent the AST in the DOM, use jQuery for traversal, and CSS for styling
	* Share plugins or themes suited for specific libraries or audiences (novice, expert, jQuery, extJS, etc..)
* Javascript needs better static analysis tools; even better if they're interactive, allowing you to explore
	* escope provides valuable insight about your code

## Samples

### Don't certain keywords? Use CSS to replace with something you prefer
```css
es.FunctionDeclaration > es.id:before,
es.FunctionExpression > es.id:before
{
	content: 'λ ' /* Show a symbol instead of 'function' */
}
```

### Don't like parentheses except around function parameters? Use CSS
```css
es.params
{
	margin-left: 4px;
}
es.params:before
{
	content: '(';
}
es.params:after
{
	content: ')';
}
es.params > es:before {
	content: ',';
	display:inline-block;
	margin-right: 20px;
}
es.params > es:first-child:before {
	content: '';
	margin-right: 0px;
}
```

## Screenshots

<img src="http://content.screencast.com/users/keeyipchan/folders/Jing/media/ee49cfc7-cf1a-4bf9-8bdd-c509927edad6/00000001.png"/>

<img src="http://content.screencast.com/users/keeyipchan/folders/Jing/media/a8f2e573-399e-417e-ac01-cde111c7116c/00000002.png"/>

<img src="http://content.screencast.com/users/keeyipchan/folders/Jing/media/0a08e3e7-7083-4f95-bc09-0444efd41340/00000003.png"/>

