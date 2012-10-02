<div style="{{[
	'padding: 10px',
	'color:' + (color or 'black'),
	'border: 1px solid ' + (borderColor or 'white'),
	'border-radius:' + (borderRadius or 0) + 'px',
	'background-color:' + (backgroundColor or 'white')
].join(';')}}">
	<a target="_blank" href="{{href}}">{{href}}</a>
</div>