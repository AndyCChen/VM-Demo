export const CONFIG = Object.freeze({
	MAX: 64,
	TLB_SIZE: 3,
	PHYSICAL_PAGES: 3,
   PAGE_TBL_SIZE: function () {
		return ((this.MAX - 1) >>> 4) + 1
	},
	PAGE_SIZE: function () {
		return ((this.MAX - 1)& 0xF) + 1
	}
})