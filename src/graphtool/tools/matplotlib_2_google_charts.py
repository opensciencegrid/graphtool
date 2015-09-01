
mpl_2_gc = {
            'GratiaStackedBar':   {
                                    'gc_type':'gc_combo_chart',
                                    'gc_js_setup':
                                        """
                                        gc_obj.chart_properties = {
                                            seriesType: 'bars',
                                            isStacked: true,
                                            bar: { groupWidth: '90%' },
                                            legend:   { 
                                                        textStyle: {fontSize: 12},
                                                        position:  'top',
                                                        alignment: 'right',
                                                        maxLines: 5
                                                      },
                                            chartArea:{width:'80%',height:'50%'}
                                        };
                                        gc_obj.chart_formatters = {}
                                        """
                                  },
            'GratiaPie':          {
                                    'gc_type':'gc_pie_chart',
                                    'gc_js_setup':
                                        """
                                        gc_obj.chart_properties = {
                                          title:this.title,
                                          slices: {  0: {offset: 0.1},
                                                     1: {offset: 0.05},
                                                     2: {offset: 0.025}
                                                   }
                                        };
                                        gc_obj.chart_formatters = {}
                                        """
                                    }
            }

