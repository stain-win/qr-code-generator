import './app.element.scss';
import {QrCodeGenerator} from '@stain-win/qr-code-generator';

export class AppElement extends HTMLElement {

    qrCode: QrCodeGenerator;
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.qrCode = new QrCodeGenerator();
        this.qrCode.setTypeNumber(1);
        this.qrCode.createSegments('test gif creation 12304050 break it beboop');
        this.qrCode.make();
    }
    public static observedAttributes = [];

    render() {
        const templateEl = document.getElementById("content") as HTMLTemplateElement
        const template = templateEl.content.cloneNode(true);

        const linkElem = document.createElement('link');

        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', '/src/styles.scss');

        const img = document.createElement('img');
        img.setAttribute('src', this.qrCode.toDataURL(8, 20));
        (template as DocumentFragment).querySelector('#qr-code')?.appendChild(img);

        (this.shadowRoot as ShadowRoot).appendChild(template);
    }

    connectedCallback() {
        this.render();
    }
}
customElements.define('app-root', AppElement);
