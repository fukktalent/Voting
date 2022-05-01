Etherscan: `https://rinkeby.etherscan.io/address/0xEE6e0664C3A344EdaC2761DcE2A730e2e345b01d#code`

Tasks:
```
hh create --contract {contract address} --candidates {separated by commas candidates addresses} 
hh vote --contract {contract address} --pollingid {polling id} --candidateid {candidate id}
hh finish --contract {contract address} --pollingid {polling id}
hh withdraw --contract {contract address} 
hh pollingData --contract {contract address} --pollingid {polling id}
hh candidateData --contract {contract address} --pollingid {polling id} --candidateid {candidate id}
```