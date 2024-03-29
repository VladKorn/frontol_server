declare module tables {
	export interface RootObject {
		ID: number;
		DOCKINDID: number;
		CHEQUENUMBER: number;
		OPENDATE: Date;
		OPENTIME: Date;
		OPENUSERID: number;
		CLOSEDATE: Date;
		CLOSETIME: Date;
		CLOSEUSERID: number;
		DOCUMENTID: number;
		CLIENTID: number;
		STATE: number;
		EDUCATION: number;
		RMKID: number;
		SUMM: number;
		SUMMWD: number;
		ECRSESSION: number;
		CHEQUETYPE: number;
		ORDERIDENTIF: string;
		COMMENTCODE: number;
		ASPECTSCHEME: number;
		ASPECTVALUE1: number;
		ASPECTVALUE2: number;
		ASPECTVALUE3: number;
		ASPECTVALUE4: number;
		ASPECTVALUE5: number;
		HALLPLACEID?: any;
		SAVED: number;
		INNERDOCORDER: number;
		PRECHEQUE: number;
		OPENRMKID: number;
		OPENSESSION: number;
		CHNG: number;
		BDOCODE: number;
		ISFISCAL: number;
		OWNERBDO: number;
		NSHOP: number;
		EMPLOYEECODE: number;
		DOCEMPLID?: any;
		RESERVEBEG?: any;
		RESERVEEND?: any;
		RESERVEINFO: string;
		RESERVEBEF?: any;
		OWNERUSERID: number;
		CARDBONUS: number;
		ECRDEPARTMENT: number;
		PREPAYEDDOCID: number;
		GUESTCOUNT: number;
		EXTID: string;
		PRINTGROUPCODE: number;
		LASTPAYMNUM: number;
		ENTERPRISEID?: any;
		REVALUATIONDATETIME: Date;
		OPERBYINVOICE?: any;
		EXTDOCCOMMENT: string;
		CORRECTREMAIND?: any;
		CHNGFM: number;
		UUID: string;
		FULLPREPAYMENT: number;
		LAST_ORDER_UPDATE: string;
		products?: any;
		isCardPayment?: boolean;
	}
}

type Orders = Array<tables.RootObject>;
