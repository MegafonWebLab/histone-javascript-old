{{var indentLevel = 20}}
{{var selected = this.selected}}
{{var items = this.items.toMap()}}

{{macro treeItems(items, depth)}}
	{{var depth = depth or 0}}
	{{for item in items}}
		{{var itemId = item.id}}
		{{var itemTitle = item.title}}
		{{var children = item.items}}
		{{var childrenCount = children.size()}}
		{{var hasChildren = childrenCount > 0}}
		{{var subItems = hasChildren ? treeItems(children, depth + 1)}}
		{{var isExpanded = hasChildren and (
			subItems.test('-ui-treeView-item-selected') or
			subItems.test('-ui-treeView-item-expanded')
		)}}

		<div data-id="{{itemId}}" class="{{[
			'-ui-treeView-item',
			childrenCount ? '-ui-treeView-item-loaded',
			not hasChildren ? '-ui-treeView-item-terminal',
			itemId and itemId is selected ?
			'-ui-treeView-item-selected -ui-icon-selected',
			isExpanded ? '-ui-treeView-item-expanded -ui-icon-open'
		]}}" style="padding-left:{{depth * indentLevel}}px;">
			<ul class="-ui-treeView-item-wrapper">
				<li class="-ui-treeView-item-icon">
				<li class="-ui-treeView-item-title">{{itemTitle}}
			</ul>
		</div>
		<div class="{{[
			'-ui-treeView-item-children',
			isExpanded ? '-ui-treeView-item-children-shown'
		]}}">{{subItems}}</div>
	{{/for}}
{{/macro}}

<div class="{{['-ui-treeView', class ? class]}}">
	<div class="-ui-treeView-wrapper">
		<table class="-ui-treeView-table" cellpadding="0">
			<div class="-ui-treeView-wrapper">
				{{treeItems(items)}}
			</div>
		</table>
	</div>
</div>