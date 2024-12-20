export const CONFIG = Object.freeze({
	MAX: 64,
	TLB_SIZE: 2,
	PHYSICAL_PAGES: 3,
   PAGE_TABLE_SIZE: function () {
		return ((this.MAX - 1) >>> 4) + 1
	},
	PAGE_SIZE: function () {
		return ((this.MAX - 1)& 0xF) + 1
	}
})

export const ItemStyle = Object.freeze({
	FOCUSED: '1px solid red',
	UNFOCUSED: '1px solid grey'
})