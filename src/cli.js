import arg from 'arg';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { createProject } from './main';

function parseArgumentsIntoOptions(rawArgs) {
    let args = [];
    try {
        args = arg(
            {
                '--git': Boolean,
                '--yes': Boolean,
                '--install': Boolean,
                '--name': String,
                '-g': '--git',
                '-y': '--yes',
                '-i': '--install',
                '-n': '--name',
            },
            {
                argv: rawArgs.slice(2),
            }
        );
    } catch (err) {
        if (err.code === 'ARG_UNKNOWN_OPTION') {
            console.error('%s %s', chalk.yellow.bold('WARN'), err.message);
        } else {
            throw err;
        }
    }
    return {
        skipPrompts: args['--yes'] || false,
        git: args['--git'] || false,
        template: args._ ? args._[0] : '',
        runInstall: args['--install'] || false,
        name: args['--name'] || process.env.CI_PROJECT_NAME || '',
    };
}

async function promptForMissingOptions(options) {
    const defaultTemplate = 'JavaScript';

    if (options.skipPrompts) {
        return {
            ...options,
            template: options.template || defaultTemplate,
        };
    }

    const questions = [];
    if (!options.template) {
        questions.push({
            type: 'list',
            name: 'template',
            message: 'Please choose which project template to use',
            choices: ['JavaScript', 'TypeScript'],
            default: defaultTemplate,
        });
    }

    if (!options.git) {
        questions.push({
            type: 'confirm',
            name: 'git',
            message: 'Initialize a git repository?',
            default: false,
        });
    }

    const answers = await inquirer.prompt(questions);
    return {
        ...options,
        template: options.template || answers.template,
        git: options.git || answers.git,
    };
}

export async function cli(args) {
    let options = parseArgumentsIntoOptions(args);
    options = await promptForMissingOptions(options);
    await createProject(options);
}
