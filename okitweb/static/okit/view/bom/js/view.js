/*
** Copyright (c) 2020, 2022, Oracle and/or its affiliates.
** Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
*/
console.debug('Loaded BoM View Javascript');

class OkitBoMView extends OkitJsonView {

    constructor(okitjson=null, oci_data=null, resource_icons=[], parent_id = 'bom-div') {
        super(okitjson, oci_data, resource_icons, parent_id);
        this.currency = 'GBP'
    }
    get model() {return this.okitjson;}
    get data() {return this.oci_data;}

    static newView(model, oci_data=null, resource_icons=[], parent_id = 'bom-div') {
        return new OkitBoMView(model, oci_data, resource_icons, parent_id)
    }

    currencies = OkitOciProductPricing.currencies

    draw(for_export=false) {
        this.newCanvas()
        this.getBoM()
        this.drawBoMPanel()
        this.drawEstimatePanel()
    }

    newCanvas(width=100, height=100, for_export=false) {
        const canvas_div = d3.select(d3Id(this.parent_id));
        // Empty existing Canvas
        canvas_div.selectAll('*').remove();
        // Heading and Safe Harbour
        this.heading_div = canvas_div.append('div').attr('id', 'bom_heading_div').attr('class', 'bom_heading')
        this.safe_harbour_div = this.heading_div.append('div')
        this.safe_harbour_div.append('p').attr('class', 'okit-cost-small-print')
            .text("The values displayed are purely for estimation purposes only and are generated from our public pricing pages. For accurate costing you will need to consult your OCI Account Manager.")
        this.currency_div = this.heading_div.append('div').attr('class', 'align-right')
        const currency_select = this.currency_div.append('select').attr('id', 'bom_currency_select')
            .on('change', (d, i, n) => {
                this.currency = n[i].value
                this.getBoM()
                this.drawBoMPanel()
                this.drawEstimatePanel()
            })
        Object.entries(this.currencies).forEach(([k, v]) => currency_select.append('option').attr('value', k).text(`${k} - ${v.name}`))
        currency_select.property('value', this.currency)
        // BoM
        this.bom_div = canvas_div.append('div').attr('id', 'bom_div').attr('class', 'okit-bom-bom-details')
        this.bom_details = this.bom_div.append('details').attr('class', 'okit-details').attr('open', true)
        this.bom_details.append('summary').attr('class', 'summary-background').append('label').text('Bill of Materials')
        this.bom_details_div = this.bom_details.append('div').attr('class', 'okit-details-body')
        // Estimate
        this.estimate_div = canvas_div.append('div').attr('id', 'estimate_div').attr('class', 'okit-bom-estimate-details')
        this.estimate_details = this.estimate_div.append('details').attr('class', 'okit-details').attr('open', true)
        this.estimate_details.append('summary').attr('class', 'summary-background').append('label').text('Cost Estimate')
        this.estimate_details_div = this.estimate_details.append('div').attr('class', 'okit-details-body')
    }

    drawBoMPanel() {
        this.bom_details_div.selectAll('*').remove()
        const table = this.bom_details_div.append('div').attr('class', 'table okit-table')
        const thead = table.append('div').attr('class', 'thead')
        const tr = thead.append('div').attr('class', 'tr')
        tr.append('div').attr('class', 'th').text('SKU')
        tr.append('div').attr('class', 'th').text('Quantity')
        tr.append('div').attr('class', 'th').text('Description')
        tr.append('div').attr('class', 'th').text('Metric')
        tr.append('div').attr('class', 'th').text('List Price')
        tr.append('div').attr('class', 'th').text('Units')
        tr.append('div').attr('class', 'th').text('Utilization')
        tr.append('div').attr('class', 'th').text('Price per Month')
        const tbody = table.append('div').attr('class', 'tbody')
        // const bom = okitOciProductPricing ? okitOciProductPricing.generateBoM(this.model) : {bom: {}}
        Object.entries(this.bom).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0).forEach(([k, v]) => {
            const tr = thead.append('div').attr('class', 'tr')
            tr.append('div').attr('class', 'td').text(k)
            tr.append('div').attr('class', 'td right-align').text(v.quantity)
            tr.append('div').attr('class', 'td').text(v.description)
            tr.append('div').attr('class', 'td').text(v.metric)
            tr.append('div').attr('class', 'td right-align').text(`${this.currencies[this.currency].symbol}${v.list_price.toFixed(5)}`)
            tr.append('div').attr('class', 'td right-align').text(v.units)
            tr.append('div').attr('class', 'td right-align').text(v.utilization)
            tr.append('div').attr('class', 'td right-align').text(`${this.currencies[this.currency].symbol}${(Math.round((v.price_per_month + Number.EPSILON) * 100)/100).toFixed(2)}`)
        })
    }

    drawEstimatePanel() {
        this.estimate_details_div.selectAll('*').remove()
        const table = this.estimate_details_div.append('div').attr('class', 'table okit-table')
        const thead = table.append('div').attr('class', 'thead')
        const tr = thead.append('div').attr('class', 'tr')
        tr.append('div').attr('class', 'th').text('Resource')
        tr.append('div').attr('class', 'th').text('Monthly Spend')
        const tbody = table.append('div').attr('class', 'tbody')
        // const bom = okitOciProductPricing ? okitOciProductPricing.generateBoM(this.model) : {estimate: {}}
        Object.entries(this.estimate).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0).forEach(([k, v]) => {
            const tr = thead.append('div').attr('class', 'tr')
            tr.append('div').attr('class', 'td').text(k)
            tr.append('div').attr('class', 'td right-align').text(`${this.currencies[this.currency].symbol}${(Math.round((v + Number.EPSILON) * 100)/100).toFixed(2)}`)
        })
    }

    getBoM(currency) {
        currency = currency ? currency : this.currency
        const bom = okitOciProductPricing ? okitOciProductPricing.generateBoM(this.model, currency) : {bom: {}, estimate: {}}
        this.bom = bom.bom
        this.estimate = bom.estimate
    }

}


okitViewClasses.push(OkitBoMView);

let okitBoMView = null;