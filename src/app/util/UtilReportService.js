/*
 *
 * Serviço utilitário para criação de relatórios em PDF usando o pdfMake
 *
*/
angular.module('BlurAdmin').service("utilReports", function($filter){

	var svc = this;
	var diff = 0;

	svc.gerarEspelhoPonto = function(employeeInfo, employeeWorkJourney, periodo, appointsArray, totaisFtd){

		var contentArray = [];
		contentArray.push(getCompanyInfo());
		contentArray.push(createEmployeeInfo(employeeInfo));
		contentArray.push(createWorkJourney(employeeWorkJourney, periodo));
		contentArray.push(createAppointHeader());
		contentArray.push(createAppointBody(appointsArray, totaisFtd));
		contentArray.push(getSaldoMes(totaisFtd));
		contentArray.push(createSignature());

		var docDefinition = {
		    pageSize: 'A4',
		    pageOrientation: 'landscape',
		    pageMargins: [ 20, 10 ],
		 //    footer: function(currentPage, pageCount) { 
			//     return { 
			//     	text: 'teste',//currentPage.toString() + ' de ' + pageCount, 
			//     	alignment: 'right', 
			//     	margin: [20, 0] 
			//     }; 
			// },
		    styles: createStylesEspelhoPonto(),
		    defaultStyle: {
				fontSize: 7,
				margin: 0,
				color: 'black'
			},
		    // footer: {
		    //     columns: [
		    //       {text: 'Left part', aligment: 'left'},
		    //       {text: 'Right part', alignment: 'right'}
		    //     ]
		    // },
    	    content: contentArray
      	};

      	return docDefinition;
	};

	function createStylesEspelhoPonto(){

		var styles = {
			normalText: {
			    fontSize: 7,
			    bold: true,
			    margin: 0
			},
			headerI: {
				fontSize: 10,
				bold: true,
				margin: [0, 2, 0, 2],
				alignment: 'center'
			},
			rigPeq: {
			    fontSize: 7,
			    margin: [0, 2, 0, 2]
			},
			textoMenor: {
			    fontSize: 6
			}
		};

		return styles;
	};

	function getCompanyInfo(){
		
		var emiDate = $filter('date')(new Date(), 'dd/MM/yyyy, HH:mm');

		var cInfo = {
          table: {
            headerRows: 1,
            widths: ['*', 'auto'],
            body: [
              [ 
                {text: 'ESPELHO DE PONTO', style: 'headerI', border: [true, true, false, true] }, 
                {text: 'Emissão: '+emiDate, style: 'rigPeq', border: [false, true, true, true]} 
              ],
              [
                {text: 'Soll Serviços Obras e Locações LTDA\nAvenida Professor Andrade Bezerra, 1523, Salgadinho, Olinda - PE, 53110-110', border: [true, false, false, true]},
                {text: 'CNPJ: 00.323.090/0001-51', style: 'rigPeq', border: [false, false, true, true]}
              ]
            ]  
          }
	    };

	    return cInfo;
	};

	function createEmployeeInfo(employeeInfo){

		var empInfo = {
	       table: {
            headerRows: 1,
            widths: [424,150,200],
            body: [
              [
                {text: 'Nome: '+employeeInfo.name+' \n Cargo: '+employeeInfo.cargo, border: [true, false, false, false]},
                {text: 'Matrícula: '+employeeInfo.matricula+' \n Equipe: '+employeeInfo.equipe, border: [false, false, false, false]},
                {text: 'PIS: '+employeeInfo.PIS+' \n Instituição: Univasf', border: [false, false, true, false], alignment: 'right'}
              ]
            ]  
          } 
	    };

	    return empInfo;
	};

	function createWorkJourney(employeeWorkJourney, periodo){

		var daysArray = [];
		var hoursArray = [];
		
		for (var i=0; i<employeeWorkJourney.length; i++){

			daysArray.push({text: employeeWorkJourney[i].dia, style: 'normalText'});
			hoursArray.push(employeeWorkJourney[i].horario);
		}

		var workJInfo = {
	       table: {
            headerRows: 1,
            widths: [80, '*', 130],
            body: [
              [
                {text: 'Jornada de Trabalho: ', border: [true, true, false, true]},
                {
        			table: {
        				headerRows: 2,
        				body: [
        					daysArray,
        					hoursArray
        				]
        			},
        			layout: 'lightHorizontalLines'
        		},
        		{text: 'Período: ' + periodo}
              ]
            ]  
          } 
	    };

	    return workJInfo;
	};

	function createAppointHeader(){
		
		var appHeader = {
	       table: {
            headerRows: 2,
            widths: [30,344,261,130],
            body: [
              [
                {text: '\nDia', bold: true, rowSpan: 2, border: [true, false, false, true]},
                {text: 'Batimentos efetuados', bold: true, alignment: 'center', border: [true, false, false, true]},
                {text: '\nObservação', bold: true, alignment: 'center', rowSpan: 2, border: [true, false, true, true]},
                {text: 'Saldo de Horas', bold: true, alignment: 'center', border: [true, false, true, true]}
              ],
              [
                {},
                {table: {
					body: [
						    [
						     {text: 'ENT1', bold: true, margin: [5, 0], border: []}, 
						     {text: 'SAI1', bold: true, margin: [5, 0], border:[true]}, 
						     {text: 'ENT2', bold: true, margin: [5, 0], border:[true]}, 
						     {text: 'SAI2', bold: true, margin: [5, 0], border:[true]}, 
						     {text: 'ENT3', bold: true, margin: [5, 0], border:[true]}, 
						     {text: 'SAI3', bold: true, margin: [5, 0], border:[true]}, 
						     {text: 'ENT4', bold: true, margin: [5, 0], border:[true]}, 
						     {text: 'SAI4', bold: true, margin: [5, 0], border:[true]},
						     {text: 'ENT5', bold: true, margin: [5, 0], border:[true]}, 
						     {text: 'SAI5', bold: true, margin: [5, 0], border:[true]}
						    ]
					    ]
				    }
                },
                {text: 'Observação', border: [true, false, true, true]},
                {table: {
                        widths: [55, 65],
                        body: [
                            [{text: 'Crédito', bold: true, border:[], alignment: 'center'}, 
                             {text: 'Débito', bold: true, border:[true], alignment: 'center'}]
                        ]
                    }
                }
              ]
            ]
          } 
	    };

	    return appHeader;
	};

	function createAppointBody(appointsArray, totaisFtd){

		var rowsArrayBody = [];
		var arrayEntSaidas = [];
		var staticArrayEntSaidas = ['-', '-', '-','-', '-', '-','-', '-', '-', '-'];
		var maxIndexArray = 0;
		
		for (var i=0; i<appointsArray.length; i++){

			arrayEntSaidas = [];
			maxIndexArray = 0;
			staticArrayEntSaidas = ['-', '-', '-','-', '-', '-','-', '-', '-', '-'];

			if (appointsArray[i].hasPoint){
				arrayEntSaidas = appointsArray[i].marcacoesStr.split(',');
			
				if (arrayEntSaidas.length <= staticArrayEntSaidas.length)
					maxIndexArray = arrayEntSaidas.length;
				else 
					maxIndexArray = staticArrayEntSaidas.length;

				for (var j=0; j<maxIndexArray; j++){
					staticArrayEntSaidas[j] = arrayEntSaidas[j];
				}
			}

			var observ = appointsArray[i].observacao ? appointsArray[i].observacao : "-";
			
			var saldoP = '00:00';
			var saldoN = '00:00';
			console.log('order: ', i);
			console.log('appointsArray: ', appointsArray[i]);
			if (appointsArray[i].saldo){

				if (appointsArray[i].saldo.horasPosit){
					saldoP = appointsArray[i].saldo.horasFtd;
				}

				if (appointsArray[i].saldo.horasNegat){
					saldoN = appointsArray[i].saldo.horasFtd;
				}
			}

			rowsArrayBody.push([
				{text: appointsArray[i].date, border: [true, false, false, true]},
				{text: staticArrayEntSaidas[0], border: [true, false, false, true], alignment: 'center'},
				{text: staticArrayEntSaidas[1], border: [false, false, false, true], alignment: 'center'},
				{text: staticArrayEntSaidas[2], border: [false, false, false, true], alignment: 'center'},
				{text: staticArrayEntSaidas[3], border: [false, false, false, true], alignment: 'center'},
				{text: staticArrayEntSaidas[4], border: [false, false, false, true], alignment: 'center'},
				{text: staticArrayEntSaidas[5], border: [false, false, false, true], alignment: 'center'},
				{text: staticArrayEntSaidas[6], border: [false, false, false, true], alignment: 'center'},
				{text: staticArrayEntSaidas[7], border: [false, false, false, true], alignment: 'center'},
				{text: staticArrayEntSaidas[8], border: [false, false, false, true], alignment: 'center'},
				{text: staticArrayEntSaidas[9], border: [false, false, false, true], alignment: 'center'},
				{text: observ, alignment: 'center', border: [true, false, true, true]},
				{text: saldoP, alignment: 'center', border: [true, false, true, true]},
				{text: saldoN, alignment: 'center', border: [true, false, true, true]}
			]);

		}

		rowsArrayBody.push([
			{text: '', border: [true, false, false, true]},
			{text: '', border: [false, false, false, true], alignment: 'center'},
			{text: '', border: [false, false, false, true], alignment: 'center'},
			{text: '', border: [false, false, false, true], alignment: 'center'},
			{text: '', border: [false, false, false, true], alignment: 'center'},
			{text: '', border: [false, false, false, true], alignment: 'center'},
			{text: '', border: [false, false, false, true], alignment: 'center'},
			{text: '', border: [false, false, false, true], alignment: 'center'},
			{text: '', border: [false, false, false, true], alignment: 'center'},
			{text: '', border: [false, false, false, true], alignment: 'center'},
			{text: '', border: [false, false, false, true], alignment: 'center'},
			{text: 'Totais:', bold: true, alignment: 'right', border: [false, false, true, true]},
			{text: totaisFtd.saldoPositivo, alignment: 'center', border: [true, false, true, true]},
			{text: totaisFtd.saldoNegativo, alignment: 'center', border: [true, false, true, true]}
		]);

		console.log('rowsArrayBody: ', rowsArrayBody);

		var appBody = {
            style: 'textoMenor',
	        table: {
	            headerRows: 0,
	            widths: [30, 30, 30, 23, 25, 25, 25, 27, 30, 25, 23, 261, 61, 60],
             	// body: [
              //     line1
              //   ]
              	body: rowsArrayBody
	        }
	    };

	    return appBody;	    
	};

	function getSaldoMes(totaisFtd){

		var rowSaldo = {
	        table: {
                headerRows: 1,
                widths: ['*'],
                body: [
                  [
                    {
                     text: 'Horas a Trabalhar: ' + totaisFtd.aTrabalhar + ' | Horas Trabalhadas: ' + totaisFtd.trabalhados + ' | Saldo do Mês: ' + totaisFtd.saldoFinal, 
                     bold: true, 
                     alignment: 'right', 
                     border: [true, false, true, true]
                 	}
                  ]
                ]  
            }   
	    };

	    return rowSaldo;
	};

	function createSignature(){

		var signature = {   
	        table: {
	            headerRows: 1,
	            widths: ['*', 'auto'],
	            body: [
	              [
	                {text: 'Confirmo a frequência      ____/____/________', margin: [50, 5, 20, 0], border: [true, false, false, true]},
	                {
	                    border: [false, false, true, true],
	                    stack: [
					    {text: '____________________________________________________________________________', style: 'rigPeq', margin: [20, 5, 50, 0], border: [false, false, false, false]},
					    {text: 'Assinatura', margin: [125,0], style: 'rigPeq'},
	    			  ]
	                }
	              ]
	            ]  
            }   
	    };

	    return signature;
	};

	function converteParaHoraMinutoSeparados(totalMinutes) {
      
      var hours = Math.floor(totalMinutes/60);
      var minutes = totalMinutes % 60;

      var hoursStr = "";
      var minutesStr = "";

      hoursStr = (hours >= 0 && hours <= 9) ? "0"+hours : ""+hours;           
      minutesStr = (minutes >= 0 && minutes <= 9) ? "0"+minutes : ""+minutes;

      return {hora: hoursStr, minuto: minutesStr};
    };

});