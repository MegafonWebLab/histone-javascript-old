{{var myVar = 10}}

{{macro myMacro}}
	{{self.arguments.toJSON()}}
{{/macro}}