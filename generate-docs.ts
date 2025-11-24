/**
 * Script to generate documentation for the authMachine.
 */

import * as fs from 'fs';
import { createAuthMachine } from './src/features/auth/machine/authMachine';
import { IAuthRepository } from './src/features/auth/types';

// Mock repository to instantiate the machine
const mockRepo: IAuthRepository = {
  login: jest.fn(),
  register: jest.fn(),
  requestPasswordReset: jest.fn(),
  verifyOtp: jest.fn(),
  resetPassword: jest.fn(),
  checkSession: jest.fn(),
  logout: jest.fn(),
};

const machine = createAuthMachine(mockRepo);

// --- HTML Generation ---

let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Auth Machine State Description</title>
    <style>
        body { font-family: sans-serif; margin: 2em; }
        .state { border: 1px solid #ccc; border-radius: 5px; padding: 1em; margin-bottom: 1em; }
        .state-title { font-weight: bold; font-size: 1.2em; color: #333; }
        .state-initial { font-style: italic; color: #555; }
        .events, .actions, .invokes { margin-left: 2em; }
        .event-name { font-weight: bold; color: #005a9e; }
        .action-name { font-style: italic; color: #2a7e2a; }
        .invoke-src { font-family: monospace; color: #881391; }
        ul { list-style: none; padding-left: 1.5em; border-left: 1px solid #eee; }
    </style>
</head>
<body>
<h1>Auth Machine State Description</h1>
`;

function generateHtmlForState(stateNode: any, level = 0) {
  const { id, initial, states, on, invoke, actions } = stateNode;

  html += `<div class="state" style="margin-left: ${level * 2}em;">`;
  html += `<div class="state-title">${id}</div>`;

  if (initial) {
    html += `<div class="state-initial">Initial State: <strong>${initial}</strong></div>`;
  }

  if (on) {
    html += '<div class="events"><h4>Transitions:</h4><ul>';
    for (const event in on) {
      const target = (on[event] as any)[0]?.target || 'self';
      html += `<li><span class="event-name">${event}</span> &rarr; ${JSON.stringify(target)}</li>`;
    }
    html += '</ul></div>';
  }
  
  if (actions && actions.length > 0) {
    html += '<div class="actions"><h4>Actions on Entry/Exit:</h4><ul>';
    actions.forEach((action: any) => {
      html += `<li><span class="action-name">${action.type}</span></li>`;
    });
    html += '</ul></div>';
  }

  if (invoke) {
    html += '<div class="invokes"><h4>Invoked Actors:</h4><ul>';
    (Array.isArray(invoke) ? invoke : [invoke]).forEach((inv) => {
        html += `<li>Source: <span class="invoke-src">${inv.src}</span></li>`;
    });
    html += '</ul></div>';
  }

  if (states) {
    for (const stateKey in states) {
      generateHtmlForState(states[stateKey], level + 1);
    }
  }

  html += '</div>';
}

generateHtmlForState(machine.definition);
hhtml += '</body></html>';

fs.writeFileSync('authMachineDescription.html', html);
console.log('Generated authMachineDescription.html');


// --- Tree View Generation ---

let tree = 'Auth Machine Tree View\n\n';

function generateTreeForState(stateNode: any, prefix = '') {
  const { id, states } = stateNode;
  tree += `${prefix}${id}\n`;

  if (states) {
    const stateKeys = Object.keys(states);
    stateKeys.forEach((key, index) => {
      const isLast = index === stateKeys.length - 1;
      const newPrefix = prefix + (isLast ? '└── ' : '├── ');
      generateTreeForState(states[key], newPrefix);
    });
  }
}

generateTreeForState(machine.definition);
fs.writeFileSync('authMachineTreeView.txt', tree);
console.log('Generated authMachineTreeView.txt');
