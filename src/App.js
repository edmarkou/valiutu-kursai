import React, { Component } from 'react';
import Loader from 'react-loader-spinner'
import './App.css';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import axios from 'axios';
import Menu from "@material-ui/core/es/Menu/Menu";
import MenuItem from "@material-ui/core/es/MenuItem/MenuItem";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      anchorEl: null,
      dateForm: 'Certain date\n',
      currency: '',
      dateFrom: '',
      dateTo: '',
      kursai: [],
      availableCurrencies: [],
      skirtumas: null,
      certainDate: ''
    }
  }

  handleCurrencyType(event) {
    this.setState({ [event.target.id]: event.target.value })
  }

  onCurrencySearch() {
    this.getFxRates();
  }

  componentDidMount() {
    this.getCurrentRates('EU');
  }

  getCurrentRates(currency) {
    axios.get(`/rates/getCurrentFxRates/${currency}`)
      .then(res => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(res.data,"text/xml");
        let kursai = [];
        for(let i = 0; i < xmlDoc.getElementsByTagName("FxRates")[0].children.length; i++) {
          kursai.push(xmlDoc.getElementsByTagName("FxRates")[0].children[i].getElementsByTagName("Ccy")[1].textContent + " " +
            xmlDoc.getElementsByTagName("FxRates")[0].children[i].getElementsByTagName("Amt")[1].textContent);
        }
        let availableCurrencies = [];
        for(let i = 0; i < kursai.length; i++) {
          let split = kursai[i].split(" ");
          availableCurrencies.push(split[0]);
        }
        this.setState({ kursai, availableCurrencies, skirtumas: null});
      });
  }

  checkCurrency() {
    return this.state.availableCurrencies.find((value => { return value === this.state.currency.toUpperCase(); }));
  }

  getCurrentDate() {
    let today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth()+1;
    let yyyy = today.getFullYear();
    if(dd<10) {
      dd = '0'+dd
    }
    if(mm<10) {
      mm = '0'+mm
    }
    return yyyy + '-' + mm + '-' + dd;
  }

  getFxRates() {
    let currency = this.checkCurrency();
    if (currency) {
      let dateFrom = '';
      let dateTo = '';
      if (this.state.dateForm === 'From...to...\n') {
        if (this.state.dateFrom === '' && this.state.dateTo === '') {
          dateFrom = this.getCurrentDate();
          dateTo = this.getCurrentDate();
        } else if (this.state.dateFrom === '' && this.state.dateTo !== '') {
          dateFrom = this.state.dateTo;
          dateTo = this.state.dateTo;
        } else if (this.state.dateFrom !== '' && this.state.dateTo === '') {
          dateFrom = this.state.dateFrom;
          dateTo = this.state.dateFrom;
        } else {
          dateFrom = this.state.dateFrom;
          dateTo = this.state.dateTo;
        }
        axios.get(`/rates/getFxRatesForCurrency/${currency}/${dateFrom}/${dateTo}`)
          .then(res => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(res.data,"text/xml");
            let kursaii = [];
            for (let i = 0; i < xmlDoc.getElementsByTagName("FxRates")[0].children.length; i++) {
              kursaii.push(xmlDoc.getElementsByTagName("FxRates")[0].children[i].getElementsByTagName("Ccy")[1].textContent + " " +
                xmlDoc.getElementsByTagName("FxRates")[0].children[i].getElementsByTagName("Amt")[1].textContent);
            }
            let kursai = [];
            if (dateFrom !== dateTo) {
              kursai.push(kursaii.shift());
              kursai.push(kursaii.pop());
              const sk1 = kursai[0].split(' ');
              const sk2 = kursai[1].split(' ');
              const skirtumas = (sk1[1] - sk2[1]).toFixed(4);
              kursai = kursai[0].split(' ');
              this.setState({ kursai, skirtumas });
            } else this.setState({ kursai: kursaii });
          })
      } else if (this.state.dateForm === 'Certain date\n') {
        let date = '';
        if (this.state.certainDate === '') date = this.getCurrentDate();
        else date = this.state.certainDate;
        axios.get(`/rates/getFxRatesForCurrency/${currency}/${date}/${date}`)
          .then(res => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(res.data,"text/xml");
            let kursai = [];
            for (let i = 0; i < xmlDoc.getElementsByTagName("FxRates")[0].children.length; i++) {
              kursai.push(xmlDoc.getElementsByTagName("FxRates")[0].children[i].getElementsByTagName("Ccy")[1].textContent + " " +
                xmlDoc.getElementsByTagName("FxRates")[0].children[i].getElementsByTagName("Amt")[1].textContent);
            }
            this.setState({ kursai, skirtumas: null });
          })
      }
    } else if (this.state.certainDate !== '' || this.state.dateFrom !== '' || this.state.dateTo !== '') {
      let date = '';
       if (this.state.dateForm === 'Certain date\n')
         date = this.state.certainDate;
       if (this.state.dateForm === 'From...to...\n') {
          if (this.state.dateTo !== '')
            date = this.state.dateTo;
          else
            date = this.state.dateFrom;
       }
      axios.get(`/rates/getFxRates/${date}`)
        .then(res => {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(res.data, "text/xml");
          let kursai = [];
          for (let i = 0; i < xmlDoc.getElementsByTagName("FxRates")[0].children.length; i++) {
            kursai.push(xmlDoc.getElementsByTagName("FxRates")[0].children[i].getElementsByTagName("Ccy")[1].textContent + " " +
              xmlDoc.getElementsByTagName("FxRates")[0].children[i].getElementsByTagName("Amt")[1].textContent);
          }
          this.setState({kursai, skirtumas: null});
        })
    }
  }

  handleClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  dateFormClick(event) {
    if (event.target.innerText === 'Certain date\n')
      this.setState({anchorEl: null, dateForm: event.target.innerText, dateTo: '', dateFrom: ''});
    else
      this.setState({anchorEl: null, dateForm: event.target.innerText, certainDate: ''});
  }

  render() {
    return (
      <div>
        <TextField
          error={!this.checkCurrency()}
          id={'currency'}
          label="Currency"
          style={{margin: '10px'}}
          value={this.state.currency}
          onChange={(event) => this.handleCurrencyType(event)}
          margin="normal"
        />
        <Button
          aria-owns={this.state.anchorEl ? 'simple-menu' : undefined}
          aria-haspopup="true"
          onClick={this.handleClick}
          style={{margin: '10px', marginTop: '25px'}}
        >
          Choose date form
        </Button>
        <Menu
          id="simple-menu"
          anchorEl={this.state.anchorEl}
          open={Boolean(this.state.anchorEl)}
          onClose={this.handleClose}
        >
          <MenuItem onClick={(e) => this.dateFormClick(e)}>Certain date</MenuItem>
          <MenuItem onClick={(e) => this.dateFormClick(e)}>From...to...</MenuItem>
        </Menu>
        {this.state.dateForm === 'Certain date\n' ?
          <TextField
            id={'certainDate'}
            label="Certain date"
            style={{margin: '10px'}}
            placeholder={'yyyy-mm-dd'}
            value={this.state.certainDate}
            onChange={(event) => this.handleCurrencyType(event)}
            margin="normal"
          />
        :
          <div style={{display: 'inline'}}>
            <TextField
              id={'dateFrom'}
              label="Date from..."
              style={{margin: '10px'}}
              placeholder={'yyyy-mm-dd'}
              value={this.state.dateFrom}
              onChange={(event) => this.handleCurrencyType(event)}
              margin="normal"
            />
            <TextField
              id={'dateTo'}
              label="Date to..."
              style={{margin: '10px'}}
              placeholder={'yyyy-mm-dd'}
              value={this.state.dateTo}
              onChange={(event) => this.handleCurrencyType(event)}
              margin="normal"
            />
          </div>
        }
        <Button
          style={{margin: '10px', marginTop: '25px'}}
          onClick={() => this.onCurrencySearch()}
        >
          Search
        </Button>
        <Button
          style={{margin: '10px', marginTop: '25px'}}
          onClick={() => this.getCurrentRates('EU')}
        >
          Get current rates
        </Button>
        {this.state.kursai.length ? (this.state.skirtumas !== null ?
          <table style={{width: "50%"}}>
            <tbody>
            <tr>
              <th>Currency code</th>
              <th>Cross-rate with 1€</th>
              <th>Difference</th>
            </tr>
            <tr>
              <th style={{fontWeight: 'normal'}}>{this.state.kursai[0]}</th>
              <th style={{fontWeight: 'normal'}}>{this.state.kursai[1]}</th>
              <th style={this.state.skirtumas >= 0 ?
                  {color: 'green'}
                  :
                  {color: 'red'}}>{this.state.skirtumas > 0 ? '+'+this.state.skirtumas : this.state.skirtumas}</th>
            </tr>
            </tbody>
          </table>
          :
          <table style={{width: "50%"}}>
            <tbody>
            <tr>
              <th>Currency code</th>
              <th>Cross-rate with 1€</th>
            </tr>
            {this.state.kursai.map(kursas => {
              const padalintasKursas = kursas.split(" ");
              return (
                <tr key={padalintasKursas[0]}>
                  <th style={{fontWeight: 'normal'}}>{padalintasKursas[0]}</th>
                  <th style={{fontWeight: 'normal'}}>{padalintasKursas[1]}</th>
                </tr>
              )
            })}
            </tbody>
          </table>)
           :
          <div style={{width: '80px', margin: 'auto'}}>
            <Loader type="ThreeDots" color="#somecolor" height={80} width={80} />
          </div>
           }
      </div>
    );
  }
}

export default App;